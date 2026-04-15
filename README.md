# Darash

> כִּי עֶזְרָא הֵכִין לְבָבוֹ לִדְרוֹשׁ אֶת־תּוֹרַת יְהוָה וְלַעֲשֹׂת וּלְלַמֵּד בְּיִשְׂרָאֵל חֹק וּמִשְׁפָּֽט׃ס

> For Ezra had set his heart to study the Law of the LORD, and to do it and to
> teach his statutes and rules in Israel. (Ezra 7:10)


🏗️ WIP


## Bootstrapping setup

### Terraform remote state (S3 Bucket)

Terraform-based deployment requires remote state (CI runners don't have access
to a local `.tfstate` file). State should be stored in an S3 bucket, along with
a lockfile (See [Terraform S3
Backend](https://developer.hashicorp.com/terraform/language/backend/s3)). This
bucket cannot be created by Terraform, so must be created manually beforehand.

Run locally:
```bash
aws s3api create-bucket \
  --bucket darash-terraform-state \
  --region eu-west-1 \
  --create-bucket-configuration LocationConstraint=eu-west-1

aws s3api put-bucket-versioning \
  --bucket darash-terraform-state \
  --versioning-configuration Status=Enabled
```

### Github Actions OIDC provider + IAM role

First, create the OIDC identity provider for AWS account:
``` bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

Then create the IAM policy that permissions Terraform:
```bash
aws iam create-policy \
  --policy-name darash-terraform-ci \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
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
        ],
        "Resource": "*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        "Resource": [
          "arn:aws:s3:::darash-terraform-state",
          "arn:aws:s3:::darash-terraform-state/*"
        ]
      },
      {
        "Effect": "Allow",
        "Action": [
        "iam:ListOpenIDConnectProviders",
        "iam:GetOpenIDConnectProvider"
        ],
        "Resource": "*"
      },
      {
        "Effect": "Allow",
        "Action": [
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
        ],
        "Resource": "arn:aws:iam::<ACCOUNT_ID>:role/darash-*"
      },
      {
          "Effect": "Allow",
          "Action": [
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
          ],
          "Resource": "arn:aws:ecr:eu-west-1:<ACCOUNT_ID>:repository/darash-*"
        }
    ]
  }'
```

Create IAM role scoped to main branch of this repo (replace `<ACCOUNT_ID>` with
AWS account id):
```bash
aws iam create-role \
  --role-name darash-terraform-ci \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
        },
        "Action": "sts:AssumeRoleWithWebIdentity",
        "Condition": {
          "StringEquals": {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
          },
          "StringLike": {
            "token.actions.githubusercontent.com:sub": "repo:AndyHolt/darash:ref:refs/heads/main"
          }
        }
      }
    ]
  }'
```

Then attach role and policy, replacing `<POLICY_ARN>` with policy ARN output
from creating the policy above:
```bash
aws iam attach-role-policy \
  --role-name darash-terraform-ci \
  --policy-arn <POLICY_ARN>
```

### Github repo secrets

Add the created AWS role to Github secrets so workflow can request the correct
role:
```bash
gh secret set AWS_ROLE_ARN --body "arn:aws:iam::<ACCOUNT_ID>:role/darash-terraform-ci"
```

### Ingest role

The IAM user and permissions for running the ingest workflow are configured in
Terraform. But there's a partial bootstrapping issue when running the workflow
itself as the role ARN is needed to access Terraform state from AWS. So to get
the role ARN Terraform output, we need to already have it.

The solution to this would be to have the "terraform apply" workflow add the role
ARN to Github secrets when provisioning. But this requires significant
additional permissions for the "terraform apply" workflow. So for now, we can do
this manually after the user is created, and before running the workflow:

```bash
cd infra && terraform output -raw ingest_role_arn | gh secret set AWS_INGEST_ROLE_ARN
```

Then also for query role:
```bash
cd infra && terraform output -raw query_role_arn | gh secret set AWS_QUERY_ROLE_ARN
```
