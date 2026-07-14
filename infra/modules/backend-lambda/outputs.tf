output "function_name" {
  description = "Name of the Lambda function. Used by the backend-deploy workflow to update function code."
  value       = aws_lambda_function.this.function_name
}

output "function_arn" {
  description = "ARN of the Lambda function."
  value       = aws_lambda_function.this.arn
}

output "function_url" {
  description = "HTTPS endpoint of the function URL. AWS_IAM auth — signed requests only; becomes the CloudFront /api/* origin at cutover."
  value       = aws_lambda_function_url.this.function_url
}

output "execution_role_arn" {
  description = "ARN of the function's execution role (CloudWatch Logs only)."
  value       = aws_iam_role.exec.arn
}
