variable "name" {
  description = "Name of the ECR repository."
  type        = string
}

variable "image_tag_mutability" {
  description = "Whether image tags can be overwritten. One of MUTABLE or IMMUTABLE."
  type        = string
  default     = "MUTABLE"
}

variable "scan_on_push" {
  description = "Whether images are scanned for vulnerabilities on push."
  type        = bool
  default     = true
}

variable "force_delete" {
  description = "Whether the repository can be destroyed while it still contains images."
  type        = bool
  default     = false
}

variable "tagged_image_retention_count" {
  description = "How many of the most recent tagged images to keep. Older tagged images are expired by the lifecycle policy. Each deploy pushes the same image under a SHA tag and 'latest', so this is roughly that many deploys of rollback history."
  type        = number
  default     = 10
}
