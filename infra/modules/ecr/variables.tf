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
