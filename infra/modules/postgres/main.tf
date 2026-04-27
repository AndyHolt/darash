resource "random_password" "master" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "master" {
  name                    = "${var.identifier}-db-master"
  description             = "Master DB credentials for ${var.identifier}. Managed by Terraform; not rotated."
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "master" {
  secret_id = aws_secretsmanager_secret.master.id
  secret_string = jsonencode({
    username = var.username
    password = random_password.master.result
  })
}

resource "aws_db_instance" "this" {
  identifier = var.identifier

  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = var.instance_class

  allocated_storage = var.allocated_storage
  storage_type      = "gp3"

  db_name  = var.db_name
  username = var.username
  password = random_password.master.result

  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = var.vpc_security_group_ids
  publicly_accessible    = var.publicly_accessible

  backup_retention_period      = var.backup_retention_period
  deletion_protection          = var.deletion_protection
  skip_final_snapshot          = var.skip_final_snapshot
  apply_immediately            = var.apply_immediately
  performance_insights_enabled = false

  tags = {
    Name = var.identifier
  }
}

# Read-only application user. Granted SELECT on morphgnt_sblgnt only — see
# README for the one-time SQL that creates the role and grants. The password
# lives in Secrets Manager and is injected into the ECS task at launch.
resource "random_password" "app" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "app" {
  name                    = "${var.identifier}-db-app"
  description             = "Read-only app DB credentials for ${var.identifier}. Managed by Terraform; not rotated."
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    username = var.app_username
    password = random_password.app.result
  })
}
