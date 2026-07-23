locals {
  s3_origin_id     = "s3-frontend"
  lambda_origin_id = "lambda-api"

  # CloudFront origin domains are bare hosts; the function URL comes as a full
  # https:// URL with a trailing slash.
  lambda_origin_domain = trimsuffix(trimprefix(var.lambda_function_url, "https://"), "/")
}

# --- S3 bucket for frontend assets ------------------------------------------

resource "aws_s3_bucket" "this" {
  bucket = var.s3_bucket_name

  tags = {
    Name = var.s3_bucket_name
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "this" {
  bucket = aws_s3_bucket.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontOAC"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.this.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.this.arn
          }
        }
      },
    ]
  })
}

# --- CloudFront OAC ---------------------------------------------------------

resource "aws_cloudfront_origin_access_control" "this" {
  name                              = var.s3_bucket_name
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Signs /api/* origin requests to the Lambda function URL (AWS_IAM auth). The
# AllViewerExceptHostHeader origin-request policy below is required for this to
# work: the SigV4 signature covers the Lambda URL's own Host, so the viewer Host
# must not be forwarded.
resource "aws_cloudfront_origin_access_control" "lambda" {
  name                              = "${var.project}-backend-lambda"
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Lets this distribution invoke the function URL. The function URL is AWS_IAM
# auth, so unsigned callers get 403; only CloudFront (matched by SourceArn) can
# reach it, via the OAC signature above.
#
# Two actions are required, not one: for function URLs created after October
# 2025, the OAC principal needs BOTH lambda:InvokeFunctionUrl and
# lambda:InvokeFunction, or the signed origin request is rejected with a 403
# AccessDeniedException before it reaches the function. aws_lambda_permission
# takes a single action, so this is two resources.
resource "aws_lambda_permission" "cloudfront" {
  statement_id           = "AllowCloudFrontInvoke"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = var.lambda_function_name
  principal              = "cloudfront.amazonaws.com"
  source_arn             = aws_cloudfront_distribution.this.arn
  function_url_auth_type = "AWS_IAM"
}

# No function_url_auth_type here: that argument is only valid for the
# InvokeFunctionUrl action (AddPermission rejects it otherwise). SourceArn alone
# scopes this to the distribution.
resource "aws_lambda_permission" "cloudfront_invoke_function" {
  statement_id  = "AllowCloudFrontInvokeFunction"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.this.arn
}

# --- Managed cache and origin-request policies -------------------------------

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

# --- CloudFront distribution -------------------------------------------------

resource "aws_cloudfront_distribution" "this" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  http_version        = "http2and3"
  price_class         = "PriceClass_100"
  aliases             = var.domain_aliases
  comment             = "${var.project} frontend"

  # S3 origin — serves the built React app
  origin {
    domain_name              = aws_s3_bucket.this.bucket_regional_domain_name
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.this.id
  }

  # Lambda origin — serves /api/* from the backend function URL
  origin {
    domain_name              = local.lambda_origin_domain
    origin_id                = local.lambda_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.lambda.id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default behavior: serve frontend from S3
  default_cache_behavior {
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  # /api/* → Lambda function URL, no caching
  ordered_cache_behavior {
    path_pattern             = "/api/*"
    target_origin_id         = local.lambda_origin_id
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    compress                 = true
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
  }

  # SPA: return index.html for paths that don't match an S3 object
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name = "${var.project}-frontend"
  }
}
