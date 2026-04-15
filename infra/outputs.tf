output "db_endpoint" {
  description = "RDS Postgres connection endpoint (host:port)."
  value       = module.postgres.endpoint
}

output "db_address" {
  description = "RDS Postgres hostname."
  value       = module.postgres.address
}

output "db_port" {
  description = "RDS Postgres port."
  value       = module.postgres.port
}

output "db_name" {
  description = "Name of the Postgres database."
  value       = module.postgres.db_name
}

output "db_master_user_secret_arn" {
  description = "ARN of the Secrets Manager secret holding the RDS master user credentials."
  value       = module.postgres.master_user_secret_arn
}

output "db_security_group_id" {
  description = "Security group ID attached to the RDS instance."
  value       = module.aws_interface.db_security_group_id
}

output "backend_security_group_id" {
  description = "Security group ID for backend instances."
  value       = module.aws_interface.backend_security_group_id
}

output "ingest_role_arn" {
  description = "IAM role ARN for the ingest-prod GitHub Actions workflow."
  value       = module.ingest_role.role_arn
}

output "query_role_arn" {
  description = "IAM role ARN for the db-query GitHub Actions workflow."
  value       = module.query_role.role_arn
}

output "backend_ecr_repository_url" {
  description = "URL of the ECR repository that holds backend service docker images."
  value       = module.backend_ecr.repository_url
}

output "backend_ecr_repository_arn" {
  description = "ARN of the ECR repository that holds backend service docker images."
  value       = module.backend_ecr.repository_arn
}
