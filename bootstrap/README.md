# Bootstrap

Terraform for the "bootstrap" AWS resources that the rest of the project's
Terraform depends on — the S3 bucket that holds remote state, the GitHub
Actions OIDC provider, and the `darash-terraform-ci` role and policy that the
`terraform-apply` workflow assumes.

These resources can't be managed from `infra/` because `infra/` uses the S3
bucket as its state backend, and the `terraform-ci` role is what runs it. So
this module is applied separately, locally, and kept deliberately small.

## State

State is **local** (no backend configuration). The S3 bucket this module
creates is what stores remote state for `infra/`, so it can't hold its own
state. `terraform.tfstate` lives on disk and is gitignored.

## Usage

```bash
cd bootstrap
terraform init
terraform plan
terraform apply
```

## When to run

Rarely. Only when a bootstrap resource needs to change — most commonly,
adding a new action to the `darash-terraform-ci` IAM policy because the main
infra has grown to manage a new AWS service.

Day-to-day infra changes go through `infra/` and the `terraform-apply`
workflow, not here.
