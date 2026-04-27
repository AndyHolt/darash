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
  description = "Container image for the placeholder task. Replace with the ECR image URI once the real backend is published."
  type        = string
  default     = "public.ecr.aws/nginx/nginx:stable"
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

variable "db_secret_arn" {
  description = "ARN of the Secrets Manager secret holding the DB credentials the backend connects with (keys: username, password). Expected to be the read-only app user, not the master."
  type        = string
}
