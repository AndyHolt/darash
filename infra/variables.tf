variable "region" {
  description = "AWS region the database infrastructure is provisioned into."
  type        = string
  default     = "eu-west-1"
}

variable "project" {
  description = "Project name. Used as a prefix/identifier for AWS resources."
  type        = string
  default     = "darash"
}

variable "domain_name" {
  description = "Primary domain name the ACM certificate was issued for. Used only to look up the cert via data source."
  type        = string
  default     = "darashbible.com"
}
