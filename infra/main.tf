module "backend_ecr" {
  source = "./modules/ecr"

  name = "${var.project}-backend"
}

# Serves /api/* from a Function URL fronted by CloudFront (see
# frontend-hosting). Runs the same ECR image the deploy workflow pushes.
module "backend_lambda" {
  source = "./modules/backend-lambda"

  project   = var.project
  image_uri = "${module.backend_ecr.repository_url}:latest"
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
      # Lets the deploy workflow roll the Lambda to a newly-pushed image with
      # `aws lambda update-function-code`.
      {
        Sid    = "LambdaDeploy"
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode",
          # `aws lambda wait function-updated` polls GetFunctionConfiguration to
          # block until the image swap finishes, so the deploy step needs read
          # access to the function's config alongside the update action.
          "lambda:GetFunctionConfiguration",
        ]
        Resource = module.backend_lambda.function_arn
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

  project              = var.project
  s3_bucket_name       = "${var.project}-frontend"
  alb_origin_domain    = "${var.api_subdomain}.${var.domain_name}"
  lambda_function_url  = module.backend_lambda.function_url
  lambda_function_name = module.backend_lambda.function_name
  certificate_arn      = data.aws_acm_certificate.frontend.arn
  domain_aliases       = [var.domain_name]
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
