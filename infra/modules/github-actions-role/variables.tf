variable "role_name" {
  description = "Name of the IAM role."
  type        = string
}

variable "policy_json" {
  description = "IAM policy document as JSON."
  type        = string
}

variable "oidc_subject_condition" {
  description = "OIDC subject claim pattern for the trust policy (e.g. repo:owner/repo:ref:refs/heads/main)."
  type        = string
}
