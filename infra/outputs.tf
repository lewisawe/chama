output "alb_dns_name" {
  description = "ALB DNS name (internal, use CloudFront URL instead)"
  value       = aws_lb.main.dns_name
}

output "cloudfront_domain" {
  description = "CloudFront HTTPS URL — use for browser and M-Pesa callbacks"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_url" {
  description = "Full HTTPS URL"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "ecr_backend_url" {
  description = "ECR repository URL for backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_dashboard_url" {
  description = "ECR repository URL for dashboard"
  value       = aws_ecr_repository.dashboard.repository_url
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
}
