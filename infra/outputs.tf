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

output "db_master_user_secret_arn" {
  description = "ARN of the Secrets Manager secret holding the RDS master user credentials."
  value       = module.postgres.master_user_secret_arn
}
