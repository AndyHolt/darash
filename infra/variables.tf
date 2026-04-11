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
  description = "Master username for the RDS Postgres instance. The password is managed by RDS via Secrets Manager."
  type        = string
  default     = "darash"
}
