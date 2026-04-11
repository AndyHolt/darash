output "vpc_id" {
  description = "VPC the database lives in."
  value       = data.aws_vpc.default.id
}

output "db_subnet_group_name" {
  description = "Name of the DB subnet group to attach an RDS instance to."
  value       = aws_db_subnet_group.this.name
}

output "vpc_security_group_ids" {
  description = "Security group IDs to attach to an RDS instance."
  value       = [aws_security_group.db.id]
}
