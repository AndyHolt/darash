variable "project" {
  description = "Project name. Used as a prefix for resource names."
  type        = string
}

variable "db_port" {
  description = "TCP port the database listens on. Used to scope the security group ingress rule."
  type        = number
  default     = 5432
}

variable "ingress_cidrs" {
  description = "CIDR blocks allowed to reach the database on db_port. Empty list means no ingress rule is created (default: closed)."
  type        = list(string)
  default     = []
}
