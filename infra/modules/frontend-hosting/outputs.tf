output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution. Used for cache invalidation."
  value       = aws_cloudfront_distribution.this.id
}

output "cloudfront_distribution_domain_name" {
  description = "Domain name of the CloudFront distribution. Used as the CNAME target in Cloudflare."
  value       = aws_cloudfront_distribution.this.domain_name
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution."
  value       = aws_cloudfront_distribution.this.arn
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket holding frontend assets."
  value       = aws_s3_bucket.this.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket holding frontend assets."
  value       = aws_s3_bucket.this.arn
}
