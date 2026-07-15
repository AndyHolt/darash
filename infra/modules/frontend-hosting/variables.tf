variable "project" {
  description = "Project name used for tagging."
  type        = string
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket that holds the built frontend assets."
  type        = string
}

variable "lambda_function_url" {
  description = "HTTPS endpoint of the backend Lambda function URL. Becomes the /api/* origin; CloudFront reaches it via OAC-signed requests."
  type        = string
}

variable "lambda_function_name" {
  description = "Name of the backend Lambda function. Used to attach the resource-based permission letting this distribution invoke its function URL."
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
