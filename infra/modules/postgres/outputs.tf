output "endpoint" {
  description = "Connection endpoint (host:port)."
  value       = aws_db_instance.this.endpoint
}

output "address" {
  description = "Hostname of the instance."
  value       = aws_db_instance.this.address
}

output "port" {
  description = "Port the instance listens on."
  value       = aws_db_instance.this.port
}

output "arn" {
  description = "ARN of the RDS instance."
  value       = aws_db_instance.this.arn
}

output "db_name" {
  description = "Name of the database."
  value       = aws_db_instance.this.db_name
}

output "master_user_secret_arn" {
  description = "ARN of the Secrets Manager secret holding the master user credentials."
  value       = aws_db_instance.this.master_user_secret[0].secret_arn
}

output "resource_id" {
  description = "Immutable RDS resource ID (db-XXXXXX). Used to scope rds-db:connect IAM policies — distinct from the human-readable identifier."
  value       = aws_db_instance.this.resource_id
}
