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
