variable "project" {
  description = "Project name. Used as a prefix for resource names."
  type        = string
}

variable "vpc_id" {
  description = "VPC the ALB and tasks run in."
  type        = string
}

variable "subnet_ids" {
  description = "Subnets for the ALB and Fargate tasks. Must be public in the default VPC setup (tasks are assigned public IPs to reach ECR without a NAT gateway)."
  type        = list(string)
}

variable "backend_security_group_id" {
  description = "Security group attached to Fargate tasks. This module adds an ingress rule allowing the ALB to reach the container port."
  type        = string
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate attached to the HTTPS listener."
  type        = string
}

variable "container_image" {
  description = "Container image for the task. Typically the project ECR repository's :latest tag — CI pushes both :latest and a digest-pinned tag on every deploy, and registers task-def revisions using the digest. Terraform-managed revisions (env var / cpu / memory changes) reference :latest so they pull the most recent CI build at task launch instead of falling back to a placeholder."
  type        = string
}

variable "container_port" {
  description = "Port the container listens on. The ALB target group and backend SG ingress rule use this value."
  type        = number
  default     = 8080
}

variable "desired_count" {
  description = "Number of Fargate tasks to run."
  type        = number
  default     = 1
}

variable "cpu" {
  description = "Fargate task CPU units."
  type        = number
  default     = 256
}

variable "memory" {
  description = "Fargate task memory (MiB)."
  type        = number
  default     = 512
}

variable "log_retention_days" {
  description = "CloudWatch log retention for task logs."
  type        = number
  default     = 7
}

variable "db_host" {
  description = "RDS Postgres hostname."
  type        = string
}

variable "db_port" {
  description = "RDS Postgres port."
  type        = number
}

variable "db_name" {
  description = "Postgres database name."
  type        = string
}

variable "db_resource_id" {
  description = "Immutable RDS resource ID (db-XXXXXX). Used to scope the rds-db:connect IAM grant on the task role."
  type        = string
}

variable "db_app_username" {
  description = "Postgres role the backend will use once IAM database authentication is enabled. The task role is granted rds-db:connect for this user."
  type        = string
  default     = "darash_app"
}
