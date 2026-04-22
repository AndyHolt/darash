variable "project" {
  description = "Project name used for tagging."
  type        = string
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket that holds the built frontend assets."
  type        = string
}

variable "alb_origin_domain" {
  description = "Domain name of the ALB origin for /api/* requests (e.g. api.example.com). Must be covered by the ALB's ACM certificate."
  type        = string
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate in us-east-1 to attach to the CloudFront distribution."
  type        = string
}

variable "domain_aliases" {
  description = "Alternate domain names (CNAMEs) for the CloudFront distribution."
  type        = list(string)
}
