output "backend_deploy_role_arn" {
  description = "IAM role ARN for the backend-deploy GitHub Actions workflow."
  value       = module.backend_deploy_role.role_arn
}

output "backend_ecr_repository_url" {
  description = "URL of the ECR repository that holds backend service docker images."
  value       = module.backend_ecr.repository_url
}

output "backend_ecr_repository_arn" {
  description = "ARN of the ECR repository that holds backend service docker images."
  value       = module.backend_ecr.repository_arn
}

output "backend_lambda_function_name" {
  description = "Name of the backend Lambda function. Used by the backend-deploy workflow to update function code."
  value       = module.backend_lambda.function_name
}

output "backend_lambda_function_arn" {
  description = "ARN of the backend Lambda function."
  value       = module.backend_lambda.function_arn
}

output "backend_lambda_function_url" {
  description = "HTTPS endpoint of the backend Lambda function URL. AWS_IAM auth; becomes the CloudFront /api/* origin at cutover."
  value       = module.backend_lambda.function_url
}

output "cloudfront_distribution_domain_name" {
  description = "Domain name of the CloudFront distribution. Used as the CNAME target for the root domain in Cloudflare."
  value       = module.frontend_hosting.cloudfront_distribution_domain_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution. Used for cache invalidation in the frontend deploy workflow."
  value       = module.frontend_hosting.cloudfront_distribution_id
}

output "frontend_bucket_name" {
  description = "Name of the S3 bucket holding frontend assets. Used for S3 sync in the frontend deploy workflow."
  value       = module.frontend_hosting.s3_bucket_name
}

output "frontend_deploy_role_arn" {
  description = "IAM role ARN for the frontend-deploy GitHub Actions workflow."
  value       = module.frontend_deploy_role.role_arn
}
