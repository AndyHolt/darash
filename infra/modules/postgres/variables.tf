variable "identifier" {
  description = "Identifier for the RDS instance."
  type        = string
}

variable "db_name" {
  description = "Name of the initial database created on the instance."
  type        = string
}

variable "username" {
  description = "Master username for the instance. Used by ingest; the backend connects as app_username instead."
  type        = string
}

variable "app_username" {
  description = "Read-only application user. Created manually post-apply (see README); password stored in Secrets Manager."
  type        = string
}

variable "db_subnet_group_name" {
  description = "Name of the DB subnet group to place the instance in."
  type        = string
}

variable "vpc_security_group_ids" {
  description = "Security group IDs to attach to the instance."
  type        = list(string)
}

variable "engine_version" {
  description = "Postgres engine version."
  type        = string
  default     = "18.3"
}

variable "instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "allocated_storage" {
  description = "Storage in GiB."
  type        = number
  default     = 20
}

variable "backup_retention_period" {
  description = "Number of days to retain automated backups."
  type        = number
  default     = 7
}

variable "deletion_protection" {
  description = "Whether deletion protection is enabled on the instance."
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Whether to skip the final snapshot when the instance is destroyed."
  type        = bool
  default     = true
}

variable "publicly_accessible" {
  description = "Whether the instance has a public IP and is reachable from outside the VPC. Access is still controlled by the security group."
  type        = bool
  default     = false
}

variable "apply_immediately" {
  description = "Whether modifications are applied immediately or in the next maintenance window."
  type        = bool
  default     = true
}
