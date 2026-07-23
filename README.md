# Darash

> כִּי עֶזְרָא הֵכִין לְבָבוֹ לִדְרוֹשׁ אֶת־תּוֹרַת יְהוָה וְלַעֲשֹׂת וּלְלַמֵּד בְּיִשְׂרָאֵל חֹק וּמִשְׁפָּֽט׃ס

> For Ezra had set his heart to study the Law of the LORD, and to do it and to
> teach his statutes and rules in Israel. (Ezra 7:10)


🏗️ WIP


## Bootstrapping setup

### Bootstrap Terraform

The S3 bucket that holds Terraform remote state, the GitHub Actions OIDC
provider, and the `darash-terraform-ci` IAM role + policy are managed by a
separate Terraform configuration under [`infra/bootstrap/`](./infra/bootstrap). That
module is applied locally rather than via CI (it's what grants CI its
permissions in the first place). See
[`infra/bootstrap/README.md`](./infra/bootstrap/README.md) for usage.

### Github repo secrets

Add the bootstrapped AWS role ARN to Github secrets so the `infra-deploy.yml`
workflow can assume it:
```bash
cd infra/bootstrap && terraform output -raw terraform_ci_role_arn | gh secret set AWS_ROLE_ARN
```

### Backend deploy role

Add the backend deploy role ARN to GitHub secrets so the `backend-deploy`
workflow can assume it. Fetch it after the first `infra/app/` apply:
```bash
cd infra/app && terraform output -raw backend_deploy_role_arn | gh secret set AWS_BACKEND_DEPLOY_ROLE_ARN
```

### ACM certificate in us-east-1

CloudFront requires ACM certificates to be in `us-east-1`. Create a wildcard
certificate for `*.darashbible.com` in the `us-east-1` region manually via the
AWS console or CLI. Validate it using DNS (add the CNAME record Cloudflare).

### Frontend DNS (Cloudflare)

The frontend is served by a CloudFront distribution backed by an S3 bucket.
API requests (`/api/*`) are proxied through the same distribution to the
backend Lambda's Function URL, avoiding CORS issues. After the first `infra/app/`
apply that creates the CloudFront distribution:

1. Get the CloudFront distribution domain name:
   ```bash
   cd infra/app && terraform output -raw cloudfront_distribution_domain_name
   ```
2. In the Cloudflare dashboard for `darashbible.com`, add a DNS record:
   - Type: `CNAME`
   - Name: `@` (root domain)
   - Target: the CloudFront distribution domain name from step 1
   - Proxy status: **DNS only** (grey cloud)

### Frontend deploy secrets

Add the frontend deploy role ARN and CloudFront distribution ID to GitHub
secrets so the frontend deployment workflow can assume the role and invalidate
the cache:
```bash
cd infra/app && terraform output -raw frontend_deploy_role_arn | gh secret set AWS_FRONTEND_DEPLOY_ROLE_ARN
cd infra/app && terraform output -raw cloudfront_distribution_id | gh secret set AWS_CLOUDFRONT_DISTRIBUTION_ID
```

## Deploying the frontend

The `frontend-deploy` workflow (`.github/workflows/frontend-deploy.yml`) builds
the React app with Vite and syncs the output to the `darash-frontend` S3
bucket, then invalidates the CloudFront cache. It runs automatically on pushes
to `main` that touch `frontend/**`, and can be triggered manually via
`workflow_dispatch`.

## Deploying the backend

The `backend-deploy` workflow (`.github/workflows/backend-deploy.yml`) runs
`ingest` to build `data.sqlite`, builds an `arm64` Docker image from `backend/`
with that file baked in, pushes it to the `darash-backend` ECR repo (tagged with
the commit SHA and `latest`), and points the `darash-backend` Lambda at the new
image. It runs automatically on pushes to `main` that touch `backend/**`, and
can be triggered manually via `workflow_dispatch`.

Rolling back a bad deploy — point the function at an earlier image. Each deploy
pushes an image tagged with its commit SHA, so pick a previous SHA (the
function's Terraform ignores `image_uri`, so this won't be reverted by
`infra-deploy`):
```bash
REGISTRY=$(aws ecr describe-repositories --region eu-west-1 \
  --repository-names darash-backend \
  --query 'repositories[0].repositoryUri' --output text)
aws lambda update-function-code --region eu-west-1 \
  --function-name darash-backend --image-uri "$REGISTRY:<previous-sha>"
aws lambda wait function-updated --region eu-west-1 \
  --function-name darash-backend
```
List available image tags with
`aws ecr list-images --region eu-west-1 --repository-name darash-backend`.
