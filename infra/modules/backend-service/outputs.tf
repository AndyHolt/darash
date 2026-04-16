output "alb_dns_name" {
  description = "Public DNS name of the ALB. Used as the CNAME target for api.<domain> in Cloudflare."
  value       = aws_lb.this.dns_name
}

output "alb_zone_id" {
  description = "Hosted zone ID of the ALB. Needed for Route53 ALIAS records if DNS is migrated to Route53 later."
  value       = aws_lb.this.zone_id
}

output "cluster_name" {
  description = "Name of the ECS cluster."
  value       = aws_ecs_cluster.this.name
}

output "service_name" {
  description = "Name of the ECS service."
  value       = aws_ecs_service.this.name
}

output "task_execution_role_arn" {
  description = "ARN of the task execution role."
  value       = aws_iam_role.task_execution.arn
}

output "log_group_name" {
  description = "CloudWatch log group receiving task logs."
  value       = aws_cloudwatch_log_group.tasks.name
}
