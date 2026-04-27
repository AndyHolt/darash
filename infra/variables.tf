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

variable "db_name" {
  description = "Initial Postgres database name created on the RDS instance."
  type        = string
  default     = "darash"
}

variable "db_username" {
  description = "Master username for the RDS Postgres instance. Used by ingest; the backend connects as db_app_username instead."
  type        = string
  default     = "darash"
}

variable "db_app_username" {
  description = "Read-only application user the backend connects as. Created manually post-apply (see README)."
  type        = string
  default     = "darash_app"
}

variable "domain_name" {
  description = "Primary domain name the ACM certificate was issued for. Used only to look up the cert via data source."
  type        = string
  default     = "darashbible.com"
}

variable "api_subdomain" {
  description = "Subdomain that will point at the backend ALB (e.g. 'api' for api.darashbible.com). Informational only; the DNS record itself is managed manually in Cloudflare."
  type        = string
  default     = "api"
}
