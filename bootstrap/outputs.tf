output "state_bucket_name" {
  description = "Name of the S3 bucket that holds remote Terraform state."
  value       = aws_s3_bucket.state.bucket
}

output "terraform_ci_role_arn" {
  description = "ARN of the IAM role assumed by the infra-deploy.yml GitHub Actions workflow."
  value       = aws_iam_role.terraform_ci.arn
}

output "terraform_ci_policy_arn" {
  description = "ARN of the IAM policy attached to the terraform-ci role."
  value       = aws_iam_policy.terraform_ci.arn
}

output "github_oidc_provider_arn" {
  description = "ARN of the GitHub Actions OIDC identity provider."
  value       = aws_iam_openid_connect_provider.github.arn
}
