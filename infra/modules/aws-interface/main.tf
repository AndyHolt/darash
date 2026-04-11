data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.project}-db"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name    = "${var.project}-db"
    Project = var.project
  }
}

resource "aws_security_group" "db" {
  name        = "${var.project}-db"
  description = "Ingress for the ${var.project} database"
  vpc_id      = data.aws_vpc.default.id

  tags = {
    Name    = "${var.project}-db"
    Project = var.project
  }
}

resource "aws_vpc_security_group_egress_rule" "db_all" {
  security_group_id = aws_security_group.db.id
  description       = "Allow all egress"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "db" {
  for_each = toset(var.ingress_cidrs)

  security_group_id = aws_security_group.db.id
  description       = "Postgres ingress from ${each.value}"
  ip_protocol       = "tcp"
  from_port         = var.db_port
  to_port           = var.db_port
  cidr_ipv4         = each.value
}
