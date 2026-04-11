terraform {
  required_providers {
    aws = {
      source  = "hasicorp/aws"
      version = "~> 5.92"
    }
  }

  required_version = ">= 1.2"
}
