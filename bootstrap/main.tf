locals {
  account_id               = data.aws_caller_identity.current.account_id
  terraform_ci_role_name   = "${var.project}-terraform-ci"
  terraform_ci_policy_name = "${var.project}-terraform-ci"
  terraform_ci_policy_arn  = "arn:aws:iam::${local.account_id}:policy/${local.terraform_ci_policy_name}"
  github_oidc_provider_url = "token.actions.githubusercontent.com"
  github_oidc_provider_arn = "arn:aws:iam::${local.account_id}:oidc-provider/${local.github_oidc_provider_url}"
}

# --- S3 bucket for remote state ---------------------------------------------

resource "aws_s3_bucket" "state" {
  bucket = var.state_bucket_name
}

import {
  to = aws_s3_bucket.state
  id = var.state_bucket_name
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id

  versioning_configuration {
    status = "Enabled"
  }
}

import {
  to = aws_s3_bucket_versioning.state
  id = var.state_bucket_name
}

# --- GitHub Actions OIDC provider -------------------------------------------

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://${local.github_oidc_provider_url}"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

import {
  to = aws_iam_openid_connect_provider.github
  id = local.github_oidc_provider_arn
}

# --- IAM policy for the terraform-ci role -----------------------------------

resource "aws_iam_policy" "terraform_ci" {
  name        = local.terraform_ci_policy_name
  description = "Permissions granted to the GitHub Actions terraform-apply workflow."

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:*",
          "ec2:Describe*",
          "ec2:CreateSecurityGroup",
          "ec2:DeleteSecurityGroup",
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:AuthorizeSecurityGroupEgress",
          "ec2:RevokeSecurityGroupEgress",
          "ec2:CreateTags",
          "ec2:DeleteTags",
          "ec2:DescribeSecurityGroupRules",
          "ec2:CreateSecurityGroupEgressRule",
          "ec2:DeleteSecurityGroupEgressRule",
          "ec2:CreateSecurityGroupIngressRule",
          "ec2:DeleteSecurityGroupIngressRule",
          "secretsmanager:CreateSecret",
          "secretsmanager:TagResource",
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.state_bucket_name}",
          "arn:aws:s3:::${var.state_bucket_name}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "iam:ListOpenIDConnectProviders",
          "iam:GetOpenIDConnectProvider"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:CreateRole",
          "iam:GetRole",
          "iam:DeleteRole",
          "iam:UpdateAssumeRolePolicy",
          "iam:TagRole",
          "iam:UntagRole",
          "iam:PutRolePolicy",
          "iam:GetRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies"
        ]
        Resource = "arn:aws:iam::${local.account_id}:role/${var.project}-*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:CreateRepository",
          "ecr:DeleteRepository",
          "ecr:DescribeRepositories",
          "ecr:ListTagsForResource",
          "ecr:TagResource",
          "ecr:UntagResource",
          "ecr:PutImageScanningConfiguration",
          "ecr:PutImageTagMutability",
          "ecr:GetRepositoryPolicy",
          "ecr:SetRepositoryPolicy",
          "ecr:DeleteRepositoryPolicy",
          "ecr:GetLifecyclePolicy",
          "ecr:PutLifecyclePolicy",
          "ecr:DeleteLifecyclePolicy",
          "ecr:BatchDeleteImage"
        ]
        Resource = "arn:aws:ecr:${var.region}:${local.account_id}:repository/${var.project}-*"
      }
    ]
  })
}

import {
  to = aws_iam_policy.terraform_ci
  id = local.terraform_ci_policy_arn
}

# --- IAM role assumed by the terraform-apply workflow -----------------------

resource "aws_iam_role" "terraform_ci" {
  name = local.terraform_ci_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${local.github_oidc_provider_url}:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "${local.github_oidc_provider_url}:sub" = "repo:${var.github_repo}:ref:refs/heads/main"
          }
        }
      }
    ]
  })
}

import {
  to = aws_iam_role.terraform_ci
  id = local.terraform_ci_role_name
}

resource "aws_iam_role_policy_attachment" "terraform_ci" {
  role       = aws_iam_role.terraform_ci.name
  policy_arn = aws_iam_policy.terraform_ci.arn
}

import {
  to = aws_iam_role_policy_attachment.terraform_ci
  id = "${local.terraform_ci_role_name}/${local.terraform_ci_policy_arn}"
}
