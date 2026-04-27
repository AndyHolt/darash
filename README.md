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

Add the bootstrapped AWS role ARN to Github secrets so the `infra-deploy.yml`
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

### Bootstrap the backend IAM-auth DB user

The backend authenticates to RDS via IAM database authentication: each new
pool connection mints a short-lived token using the ECS task role, which is
granted `rds-db:connect`. This avoids the long-lived password drifting out
of sync after AWS rotates the master secret. The Terraform side (enabling
`iam_database_authentication_enabled` on RDS and adding the task role) is
managed automatically; the Postgres role itself has to be created once
manually because RDS-managed users cannot be defined in Terraform.

When to run: once per environment, after the Terraform changes are applied
and before `DB_IAM_AUTH=true` is flipped on the backend container.

Connect to the RDS instance as the master user (`darash`) — same access
pattern as the `db-query` GitHub Actions workflow: temporarily authorise
your IP on the RDS security group, fetch the master credentials from
Secrets Manager, run psql, then revoke the SG rule. Then run:

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'darash_app') THEN
    CREATE ROLE darash_app LOGIN;
  END IF;
END $$;

GRANT rds_iam TO darash_app;
GRANT CONNECT ON DATABASE darash TO darash_app;
GRANT USAGE ON SCHEMA public TO darash_app;
GRANT SELECT ON morphgnt_sblgnt TO darash_app;
ALTER DEFAULT PRIVILEGES FOR ROLE darash IN SCHEMA public
  GRANT SELECT ON TABLES TO darash_app;
```

The `ALTER DEFAULT PRIVILEGES FOR ROLE darash` line is what keeps the grant
working across re-ingests: ingest connects as the master user `darash` and
recreates the table, so default privileges have to be set on that role for
future tables to inherit the SELECT grant automatically.

Verify with `\du darash_app` — the role should show `Member of: {rds_iam}`.

### Frontend deploy secrets

Add the frontend deploy role ARN and CloudFront distribution ID to GitHub
secrets so the frontend deployment workflow can assume the role and invalidate
the cache:
```bash
cd infra && terraform output -raw frontend_deploy_role_arn | gh secret set AWS_FRONTEND_DEPLOY_ROLE_ARN
cd infra && terraform output -raw cloudfront_distribution_id | gh secret set AWS_CLOUDFRONT_DISTRIBUTION_ID
```

## Deploying the frontend

The `frontend-deploy` workflow (`.github/workflows/frontend-deploy.yml`) builds
the React app with Vite and syncs the output to the `darash-frontend` S3
bucket, then invalidates the CloudFront cache. It runs automatically on pushes
to `main` that touch `frontend/**`, and can be triggered manually via
`workflow_dispatch`.

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
