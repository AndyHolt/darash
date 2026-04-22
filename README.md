# Darash

> כִּי עֶזְרָא הֵכִין לְבָבוֹ לִדְרוֹשׁ אֶת־תּוֹרַת יְהוָה וְלַעֲשֹׂת וּלְלַמֵּד בְּיִשְׂרָאֵל חֹק וּמִשְׁפָּֽט׃ס

> For Ezra had set his heart to study the Law of the LORD, and to do it and to
> teach his statutes and rules in Israel. (Ezra 7:10)


🏗️ WIP


## Bootstrapping setup

### Bootstrap Terraform

The S3 bucket that holds Terraform remote state, the GitHub Actions OIDC
provider, and the `darash-terraform-ci` IAM role + policy are managed by a
separate Terraform configuration under [`bootstrap/`](./bootstrap). That
module is applied locally rather than via CI (it's what grants CI its
permissions in the first place). See
[`bootstrap/README.md`](./bootstrap/README.md) for usage.

### Github repo secrets

Add the bootstrapped AWS role ARN to Github secrets so the `terraform-apply`
workflow can assume it:
```bash
cd bootstrap && terraform output -raw terraform_ci_role_arn | gh secret set AWS_ROLE_ARN
```

### Ingest role

The IAM user and permissions for running the ingest workflow are configured in
Terraform. But there's a partial bootstrapping issue when running the workflow
itself as the role ARN is needed to access Terraform state from AWS. So to get
the role ARN Terraform output, we need to already have it.

The solution to this would be to have the "terraform apply" workflow add the role
ARN to Github secrets when provisioning. But this requires significant
additional permissions for the "terraform apply" workflow. So for now, we can do
this manually after the user is created, and before running the workflow:

```bash
cd infra && terraform output -raw ingest_role_arn | gh secret set AWS_INGEST_ROLE_ARN
```

Then also for query role:
```bash
cd infra && terraform output -raw query_role_arn | gh secret set AWS_QUERY_ROLE_ARN
```

And for the backend deploy role:
```bash
cd infra && terraform output -raw backend_deploy_role_arn | gh secret set AWS_BACKEND_DEPLOY_ROLE_ARN
```

### Backend DNS (Cloudflare)

The backend runs behind an internet-facing ALB, but DNS for `darashbible.com`
is managed in Cloudflare rather than Route53. After the first `infra/` apply
that creates the ALB, point `api.darashbible.com` at it manually:

1. Get the ALB DNS name:
   ```bash
   cd infra && terraform output -raw backend_alb_dns_name
   ```
2. In the Cloudflare dashboard for `darashbible.com`, add a DNS record:
   - Type: `CNAME`
   - Name: `api`
   - Target: the ALB DNS name from step 1
   - Proxy status: **DNS only** (grey cloud)

The ACM certificate used by the ALB is managed manually in AWS and looked up
by Terraform via a data source — no Terraform action needed when it auto-renews.

### ACM certificate in us-east-1

CloudFront requires ACM certificates to be in `us-east-1`. Create a wildcard
certificate for `*.darashbible.com` in the `us-east-1` region manually via the
AWS console or CLI. Validate it using DNS (add the CNAME record Cloudflare).
The existing `eu-west-1` wildcard cert stays in place for the ALB.

### Frontend DNS (Cloudflare)

The frontend is served by a CloudFront distribution backed by an S3 bucket.
API requests (`/api/*`) are proxied through the same distribution to the
backend ALB, avoiding CORS issues. After the first `infra/` apply that creates
the CloudFront distribution:

1. Get the CloudFront distribution domain name:
   ```bash
   cd infra && terraform output -raw cloudfront_distribution_domain_name
   ```
2. In the Cloudflare dashboard for `darashbible.com`, add a DNS record:
   - Type: `CNAME`
   - Name: `@` (root domain)
   - Target: the CloudFront distribution domain name from step 1
   - Proxy status: **DNS only** (grey cloud)

### Frontend deploy role

Add the frontend deploy role ARN to GitHub secrets so the frontend deployment
workflow can assume it:
```bash
cd infra && terraform output -raw frontend_deploy_role_arn | gh secret set AWS_FRONTEND_DEPLOY_ROLE_ARN
```

## Deploying the backend

The `backend-deploy` workflow (`.github/workflows/backend-deploy.yml`) builds
a Docker image from `backend/`, pushes it to the `darash-backend` ECR repo,
and rolls out a new ECS task-definition revision. It runs automatically on
pushes to `main` that touch `backend/**`, and can be triggered manually via
`workflow_dispatch`.

Rolling back a bad deploy — flip the service back to the previous task-def
revision:
```bash
aws ecs update-service --region eu-west-1 \
  --cluster darash-backend --service darash-backend \
  --task-definition darash-backend:<previous-revision>
```
Find `<previous-revision>` with
`aws ecs list-task-definitions --family-prefix darash-backend`.
