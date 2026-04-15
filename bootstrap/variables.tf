variable "region" {
  description = "AWS region. Must match the region used by the rest of the project."
  type        = string
  default     = "eu-west-1"
}

variable "project" {
  description = "Project name. Used as a prefix for bootstrapped resources."
  type        = string
  default     = "darash"
}

variable "state_bucket_name" {
  description = "Name of the S3 bucket that holds remote Terraform state for the project's main infra."
  type        = string
  default     = "darash-terraform-state"
}

variable "github_repo" {
  description = "GitHub <owner>/<repo> whose main branch is trusted to assume the terraform-ci role."
  type        = string
  default     = "AndyHolt/darash"
}
