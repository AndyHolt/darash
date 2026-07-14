locals {
  name = "${var.project}-backend"
}

# --- Logs -------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "this" {
  name              = "/aws/lambda/${local.name}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = local.name
  }
}

# --- Execution role (CloudWatch Logs only) ----------------------------------

# No VPC, no RDS, no Secrets Manager: the function reads a read-only data.sqlite
# baked into its image, so the only thing it needs permission to do is write
# logs. AWSLambdaBasicExecutionRole grants exactly the CloudWatch Logs actions.

data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "exec" {
  name               = "${local.name}-lambda-exec"
  assume_role_policy = data.aws_iam_policy_document.assume.json

  tags = {
    Name = "${local.name}-lambda-exec"
  }
}

resource "aws_iam_role_policy_attachment" "logs" {
  role       = aws_iam_role.exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- Function ---------------------------------------------------------------

resource "aws_lambda_function" "this" {
  function_name = local.name
  role          = aws_iam_role.exec.arn
  package_type  = "Image"
  image_uri     = var.image_uri
  architectures = [var.architecture]
  memory_size   = var.memory_size
  timeout       = var.timeout

  logging_config {
    log_format = "Text"
    log_group  = aws_cloudwatch_log_group.this.name
  }

  # CI updates the running code out-of-band with `aws lambda
  # update-function-code`, pinning a digest. Terraform seeds the function from
  # the :latest tag on first create, then stops tracking the image so applies
  # don't revert CI's digest-pinned deploy. (Same intent as the ECS
  # max(revision) dance in the backend-service module.)
  lifecycle {
    ignore_changes = [image_uri]
  }

  tags = {
    Name = local.name
  }
}

# --- Function URL -----------------------------------------------------------

# AWS_IAM auth: the raw URL returns 403 to unsigned callers. CloudFront reaches
# it via OAC, which signs origin requests with SigV4 (the invoke permission for
# the distribution and the /api/* behaviour are added at cutover). Until then
# nothing can invoke it, which is the point — it goes live only when CloudFront
# is pointed at it.
resource "aws_lambda_function_url" "this" {
  function_name      = aws_lambda_function.this.function_name
  authorization_type = "AWS_IAM"
}
