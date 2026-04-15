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
