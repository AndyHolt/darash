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

data "aws_iam_policy_document" "terraform_ci" {
  statement {
    sid = "RdsEc2SecretsKms"
    actions = [
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
      "kms:DescribeKey",
    ]
    resources = ["*"]
  }

  statement {
    sid = "TerraformState"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      "arn:aws:s3:::${var.state_bucket_name}",
      "arn:aws:s3:::${var.state_bucket_name}/*",
    ]
  }

  statement {
    sid = "OidcProviderRead"
    actions = [
      "iam:ListOpenIDConnectProviders",
      "iam:GetOpenIDConnectProvider",
    ]
    resources = ["*"]
  }

  statement {
    sid = "ProjectScopedRoles"
    actions = [
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
      "iam:ListAttachedRolePolicies",
    ]
    resources = ["arn:aws:iam::${local.account_id}:role/${var.project}-*"]
  }

  statement {
    sid = "ProjectScopedEcr"
    actions = [
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
      "ecr:BatchDeleteImage",
    ]
    resources = ["arn:aws:ecr:${var.region}:${local.account_id}:repository/${var.project}-*"]
  }
}

resource "aws_iam_policy" "terraform_ci" {
  name   = local.terraform_ci_policy_name
  policy = data.aws_iam_policy_document.terraform_ci.json
}

import {
  to = aws_iam_policy.terraform_ci
  id = local.terraform_ci_policy_arn
}

# --- IAM role assumed by the terraform-apply workflow -----------------------

data "aws_iam_policy_document" "terraform_ci_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.github_oidc_provider_url}:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "${local.github_oidc_provider_url}:sub"
      values   = ["repo:${var.github_repo}:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role" "terraform_ci" {
  name               = local.terraform_ci_role_name
  assume_role_policy = data.aws_iam_policy_document.terraform_ci_assume.json
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
