variable "project" {
  description = "Project name. Used as a prefix for resource names."
  type        = string
}

variable "image_uri" {
  description = "Container image for the function. Typically the backend ECR repository's :latest tag — used only on first create; CI thereafter updates the code out-of-band with a digest-pinned image (image_uri changes are ignored, see main.tf)."
  type        = string
}

variable "architecture" {
  description = "Instruction set architecture for the function. Stays x86_64 while ECS still runs the same image; the arm64 flip comes after ECS is gone."
  type        = string
  default     = "x86_64"
}

variable "memory_size" {
  description = "Function memory (MiB). Also scales CPU — the first knob to turn if cold starts are slow."
  type        = number
  default     = 512
}

variable "timeout" {
  description = "Function timeout (seconds). Reference lookups are sub-second; this is headroom for cold starts."
  type        = number
  default     = 10
}

variable "log_retention_days" {
  description = "CloudWatch log retention for function logs."
  type        = number
  default     = 7
}
