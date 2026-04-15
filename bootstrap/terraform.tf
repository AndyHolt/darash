terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.92"
    }
  }

  # Local state on purpose: this module manages the S3 bucket that holds remote
  # state for the rest of the project, so it can't live in that bucket itself.
  # Run locally, commit nothing, and the .tfstate stays on disk.

  required_version = ">= 1.5"
}

provider "aws" {
  region = var.region
}

data "aws_caller_identity" "current" {}
