output "vpc_id" {
  description = "VPC the database lives in."
  value       = data.aws_vpc.default.id
}

output "subnet_ids" {
  description = "Subnet IDs in the VPC. Default-VPC subnets are public, so suitable for both the ALB and Fargate tasks (with public IP) while RDS remains publicly accessible."
  value       = data.aws_subnets.default.ids
}

output "db_subnet_group_name" {
  description = "Name of the DB subnet group to attach an RDS instance to."
  value       = aws_db_subnet_group.this.name
}

output "db_security_group_id" {
  description = "Security group ID attached to the database."
  value       = aws_security_group.db.id
}

output "backend_security_group_id" {
  description = "Security group ID to attach to backend instances."
  value       = aws_security_group.backend.id
}

output "vpc_security_group_ids" {
  description = "Security group IDs to attach to an RDS instance."
  value       = [aws_security_group.db.id]
}
