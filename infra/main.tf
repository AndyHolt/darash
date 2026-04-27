data "aws_caller_identity" "current" {}

module "aws_interface" {
  source = "./modules/aws-interface"

  project       = var.project
  db_port       = 5432
  ingress_cidrs = []
}

module "postgres" {
  source = "./modules/postgres"

  identifier             = var.project
  db_name                = var.db_name
  username               = var.db_username
  db_subnet_group_name   = module.aws_interface.db_subnet_group_name
  vpc_security_group_ids = module.aws_interface.vpc_security_group_ids

  # AWS Free plan rejects retention periods above its (undocumented) free-tier
  # cap with FreeTierRestrictionError. 0 disables automated backups entirely,
  # which is acceptable here given the data is reproducible from ingest.
  backup_retention_period = 0

  # Off while the project is still in early-dev apply/destroy cycles. Flip
  # back to true (or just drop this override) once there's data worth keeping.
  deletion_protection = false

  # Allows the instance to be reached from outside the VPC (e.g. GitHub Actions
  # ingest workflow). The security group still controls which IPs can connect.
  publicly_accessible = true
}

# Shared policy for workflows that need to connect to the prod DB: read
# Terraform state, temporarily open a SG rule, and fetch the master secret.
locals {
  db_workflow_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::darash-terraform-state",
          "arn:aws:s3:::darash-terraform-state/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:DescribeSecurityGroups"
        ]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = "*"
      }
    ]
  })
}

module "ingest_role" {
  source = "./modules/github-actions-role"

  role_name              = "${var.project}-ingest-prod"
  oidc_subject_condition = "repo:AndyHolt/darash:ref:refs/heads/main"
  policy_json            = local.db_workflow_policy
}

module "query_role" {
  source = "./modules/github-actions-role"

  role_name              = "${var.project}-db-query"
  oidc_subject_condition = "repo:AndyHolt/darash:ref:refs/heads/main"
  policy_json            = local.db_workflow_policy
}

module "backend_ecr" {
  source = "./modules/ecr"

  name = "${var.project}-backend"

  # Matches the RDS deletion_protection=false stance: allow destroy during
  # early-dev apply/destroy cycles even if the repo still holds images.
  force_delete = true
}

# Looks up the manually-created ACM certificate. `most_recent` handles the
# case where a cert was reissued — always picks the newest ISSUED one
# matching the domain.
data "aws_acm_certificate" "api" {
  domain      = var.domain_name
  statuses    = ["ISSUED"]
  most_recent = true
}

module "backend_service" {
  source = "./modules/backend-service"

  project                   = var.project
  vpc_id                    = module.aws_interface.vpc_id
  subnet_ids                = module.aws_interface.subnet_ids
  backend_security_group_id = module.aws_interface.backend_security_group_id
  certificate_arn           = data.aws_acm_certificate.api.arn
  db_host                   = module.postgres.address
  db_port                   = module.postgres.port
  db_name                   = module.postgres.db_name
  db_resource_id            = module.postgres.resource_id
}

locals {
  backend_deploy_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "EcrAuth"
        Effect   = "Allow"
        Action   = "ecr:GetAuthorizationToken"
        Resource = "*"
      },
      {
        Sid    = "EcrPushPull"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage",
          "ecr:BatchGetImage",
          "ecr:DescribeImages",
        ]
        Resource = module.backend_ecr.repository_arn
      },
      # RegisterTaskDefinition and DescribeTaskDefinition don't support
      # resource-level scoping per the AWS Service Authorization Reference.
      {
        Sid    = "EcsTaskDefinition"
        Effect = "Allow"
        Action = [
          "ecs:RegisterTaskDefinition",
          "ecs:DescribeTaskDefinition",
        ]
        Resource = "*"
      },
      {
        Sid    = "EcsDeploy"
        Effect = "Allow"
        Action = [
          "ecs:DescribeServices",
          "ecs:UpdateService",
        ]
        Resource = "arn:aws:ecs:${var.region}:${data.aws_caller_identity.current.account_id}:service/${var.project}-backend/${var.project}-backend"
      },
      {
        Sid      = "PassExecutionRole"
        Effect   = "Allow"
        Action   = "iam:PassRole"
        Resource = module.backend_service.task_execution_role_arn
      },
    ]
  })
}

module "backend_deploy_role" {
  source = "./modules/github-actions-role"

  role_name              = "${var.project}-backend-deploy"
  oidc_subject_condition = "repo:AndyHolt/darash:ref:refs/heads/main"
  policy_json            = local.backend_deploy_policy
}

# --- Frontend hosting -------------------------------------------------------

# CloudFront requires ACM certificates in us-east-1.
data "aws_acm_certificate" "frontend" {
  provider    = aws.us_east_1
  domain      = var.domain_name
  statuses    = ["ISSUED"]
  most_recent = true
}

module "frontend_hosting" {
  source = "./modules/frontend-hosting"

  project           = var.project
  s3_bucket_name    = "${var.project}-frontend"
  alb_origin_domain = "${var.api_subdomain}.${var.domain_name}"
  certificate_arn   = data.aws_acm_certificate.frontend.arn
  domain_aliases    = [var.domain_name]
}

locals {
  frontend_deploy_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3Deploy"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetObject",
        ]
        Resource = [
          module.frontend_hosting.s3_bucket_arn,
          "${module.frontend_hosting.s3_bucket_arn}/*",
        ]
      },
      {
        Sid      = "CloudFrontInvalidate"
        Effect   = "Allow"
        Action   = "cloudfront:CreateInvalidation"
        Resource = module.frontend_hosting.cloudfront_distribution_arn
      },
    ]
  })
}

module "frontend_deploy_role" {
  source = "./modules/github-actions-role"

  role_name              = "${var.project}-frontend-deploy"
  oidc_subject_condition = "repo:AndyHolt/darash:ref:refs/heads/main"
  policy_json            = local.frontend_deploy_policy
}
