locals {
  account_id               = data.aws_caller_identity.current.account_id
  terraform_ci_role_name   = "${var.project}-terraform-ci"
  terraform_ci_policy_name = "${var.project}-terraform-ci"
  github_oidc_provider_url = "token.actions.githubusercontent.com"
}

# --- S3 bucket for remote state ---------------------------------------------

resource "aws_s3_bucket" "state" {
  bucket = var.state_bucket_name
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id

  versioning_configuration {
    status = "Enabled"
  }
}

# --- GitHub Actions OIDC provider -------------------------------------------

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://${local.github_oidc_provider_url}"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
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
      "ec2:GetSecurityGroupsForVpc",
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
      "iam:AttachRolePolicy",
      "iam:DetachRolePolicy",
      "iam:PassRole",
    ]
    resources = ["arn:aws:iam::${local.account_id}:role/${var.project}-*"]
  }

  statement {
    sid     = "CreateElbServiceLinkedRole"
    actions = ["iam:CreateServiceLinkedRole"]
    resources = [
      "arn:aws:iam::${local.account_id}:role/aws-service-role/elasticloadbalancing.amazonaws.com/AWSServiceRoleForElasticLoadBalancing",
    ]
    condition {
      test     = "StringEquals"
      variable = "iam:AWSServiceName"
      values   = ["elasticloadbalancing.amazonaws.com"]
    }
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

  statement {
    sid = "ProjectScopedEcs"
    actions = [
      "ecs:CreateCluster",
      "ecs:DeleteCluster",
      "ecs:DescribeClusters",
      "ecs:UpdateCluster",
      "ecs:TagResource",
      "ecs:UntagResource",
      "ecs:ListTagsForResource",
      "ecs:CreateService",
      "ecs:UpdateService",
      "ecs:DeleteService",
      "ecs:DescribeServices",
      "ecs:UpdateServicePrimaryTaskSet",
    ]
    resources = [
      "arn:aws:ecs:${var.region}:${local.account_id}:cluster/${var.project}-*",
      "arn:aws:ecs:${var.region}:${local.account_id}:service/${var.project}-*/${var.project}-*",
      "arn:aws:ecs:${var.region}:${local.account_id}:task-definition/${var.project}-*:*",
    ]
  }

  # ecs:Register/Deregister/DescribeTaskDefinition don't support meaningful
  # resource-level scoping (per the AWS Service Authorization Reference) and
  # must be granted on "*". Lumped in with the rest of the read-only ECS
  # discovery actions that likewise can't be scoped.
  statement {
    sid = "EcsDiscovery"
    actions = [
      "ecs:List*",
      "ecs:DescribeTasks",
      "ecs:DescribeTaskSets",
      "ecs:RegisterTaskDefinition",
      "ecs:DeregisterTaskDefinition",
      "ecs:DescribeTaskDefinition",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "Elb"
    actions   = ["elasticloadbalancing:*"]
    resources = ["*"]
  }

  statement {
    sid = "ProjectScopedLogs"
    actions = [
      "logs:CreateLogGroup",
      "logs:DeleteLogGroup",
      "logs:PutRetentionPolicy",
      "logs:DeleteRetentionPolicy",
      "logs:TagResource",
      "logs:UntagResource",
      "logs:ListTagsForResource",
    ]
    resources = ["arn:aws:logs:${var.region}:${local.account_id}:log-group:/ecs/${var.project}-*"]
  }

  statement {
    sid = "LogsDiscovery"
    actions = [
      "logs:DescribeLogGroups",
    ]
    resources = ["*"]
  }

  statement {
    sid = "AcmRead"
    actions = [
      "acm:DescribeCertificate",
      "acm:GetCertificate",
      "acm:ListCertificates",
      "acm:ListTagsForCertificate",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "terraform_ci" {
  name   = local.terraform_ci_policy_name
  policy = data.aws_iam_policy_document.terraform_ci.json
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

resource "aws_iam_role_policy_attachment" "terraform_ci" {
  role       = aws_iam_role.terraform_ci.name
  policy_arn = aws_iam_policy.terraform_ci.arn
}
