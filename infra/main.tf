module "aws_interface" {
  source = "./modules/aws-interface"

  project       = var.project
  db_port       = 5432
  ingress_cidrs = []
}

module "postgres" {
  source = "./modules/postgres"

  identifier             = var.project
  db_name                = var.db_name
  username               = var.db_username
  db_subnet_group_name   = module.aws_interface.db_subnet_group_name
  vpc_security_group_ids = module.aws_interface.vpc_security_group_ids

  # AWS Free plan rejects retention periods above its (undocumented) free-tier
  # cap with FreeTierRestrictionError. 0 disables automated backups entirely,
  # which is acceptable here given the data is reproducible from ingest.
  backup_retention_period = 0

  # Off while the project is still in early-dev apply/destroy cycles. Flip
  # back to true (or just drop this override) once there's data worth keeping.
  deletion_protection = false
}
