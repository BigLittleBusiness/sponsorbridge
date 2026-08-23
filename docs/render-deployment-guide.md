# SponsorBridge: Practical Render Deployment Guide

**Purpose.** This guide provides a low-operations path for deploying SponsorBridge on Render, with a separate staging environment first and a deliberate production cutover second. It is tailored to the current SponsorBridge stack: React/Vite client, Express/tRPC server, MySQL/TiDB-compatible Drizzle schema, Stripe, custom staff and sponsor authentication, and browser smoke tests.

> **Recommendation:** Render is a reasonable initial production host for SponsorBridge, but do **not** cut over directly from the current managed project environment. First remove the production dependencies on Manus-managed Forge storage and any other enabled Forge services. Those credentials and endpoints are not portable to Render.

## 1. The proposed Render architecture

| Concern | Initial Render implementation | Why this is the pragmatic starting point |
|---|---|---|
| Application | One **Docker Web Service** using the existing multi-stage `Dockerfile` | SponsorBridge already builds to `dist/index.js` and listens through the `PORT` environment variable. |
| Database | One **private MySQL 8 service** with a persistent disk at `/var/lib/mysql` | It preserves the current MySQL/Drizzle model while keeping the database off the public internet. Render’s MySQL guide uses this exact disk mount. [2] |
| Images and documents | Amazon S3 or Cloudflare R2, accessed directly through a portable storage adapter | A Render web service filesystem is ephemeral, so uploaded assets cannot live on the service disk. [6] |
| Transactional email | Amazon SES | Maintains the planned low-cost email path for receipts, invitations, password resets, and sponsorship updates. |
| Payments | Stripe, using live-mode keys only after staging validation | Existing project-contribution checkout and webhook flow can stay external to Render. |
| DNS and TLS | Render custom domain with your existing DNS provider | Render verifies the domain and automatically issues/renews TLS certificates; HTTP is redirected to HTTPS. [3] |
| Deployment gate | GitHub Actions followed by Render’s **After CI Checks Pass** auto-deploy option | Render can wait for successful GitHub checks before deploying the linked branch. [7] |

The smallest credible setup is therefore **one web service plus one private MySQL service**, with S3 and SES remaining managed external services. Do not add Redis, background workers, or separate microservices until a measured need appears.

## 2. Important migration reality: complete these portability items first

SponsorBridge’s current `server/storage.ts` uses the Manus Forge API to obtain presigned URLs and exposes assets under `/manus-storage/*`. That will not work outside the managed project environment. The following work is a required **pre-deployment gate**, not optional polish.

| Item | Current position | Required result before production cutover |
|---|---|---|
| Storage | `storagePut` and the `/manus-storage/*` proxy call Forge with `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY`. | Replace this with an S3-compatible storage adapter that writes directly to an S3/R2 bucket and returns durable public or signed URLs. |
| Forge services | The codebase includes adapters for Forge data APIs, Heartbeat, image generation, LLM, maps, notifications, and transcription. | Inventory which of these are actually reachable in SponsorBridge. Disable unused paths; replace each needed one with a provider-specific integration and its own secret. |
| Authentication | Staff and sponsor custom authentication already operates with application-owned JWT cookies. Some historic Manus OAuth plumbing remains in the codebase. | Keep the custom staff/sponsor flow as the production flow, then either remove or explicitly replace any remaining OAuth-only route before cutover. |
| Uploaded media | Child and project update images currently depend on the storage adapter above. | Migrate required existing images to S3/R2 and update stored URLs before changing DNS. |
| Scheduled work | If the product later needs recurring cleanup, expiry, or notifications, it cannot depend on the current managed Heartbeat service. | Use a Render Cron Job, a managed scheduler, or SES/EventBridge-style provider scheduling after the relevant workflow is specified. |

Do **not** copy Manus Forge keys into Render as a shortcut. They are managed-environment credentials, not a portable integration contract.

## 3. Accounts and information to prepare

Create a staging environment first. Production should remain untouched until every acceptance check in Section 12 has passed.

| Account or input | Staging | Production |
|---|---|---|
| Render workspace | A dedicated `SponsorBridge` project with a `staging` environment | A separate `production` environment in the same project or a separate workspace if access separation is needed. |
| GitHub branch | `staging` | `main` |
| Database name/user/password | Newly generated, unique values | Newly generated, unique values; never reuse staging values. |
| JWT secret | Random 32+ byte secret | Different random 32+ byte secret. |
| Stripe | Test-mode keys and test webhook signing secret | Live keys and live webhook signing secret. |
| SES | Verified sandbox identity and controlled recipient mailbox if still testing | Verified production sending domain/identity and production access. |
| Object storage | Separate bucket/prefix, such as `sponsorbridge-staging` | Separate bucket, such as `sponsorbridge-production`. |
| Domain | `staging.yourdomain.com` | `app.yourdomain.com` or your chosen canonical production domain. |

Render supports environment variables and environment groups; secret values should be entered in the dashboard rather than committed to `render.yaml`. [4] Keep staging and production values separate.

## 4. Phase A — prepare a safe database migration

### 4.1 Choose the initial MySQL pattern

For the initial Render deployment, use the official MySQL example as a **private Docker service** with MySQL 8 and a persistent disk mounted at `/var/lib/mysql`. Render private services are only reachable by services in the same workspace, and the official guide identifies the mount path as required for MySQL data persistence. [2]

> Render explicitly advises against relying on a disk snapshot as the database recovery method. Use `mysqldump`/restore for database backup and recovery procedures instead. [2]

### 4.2 Create the database service

In the Render Dashboard, create a new **Private Service** from the official MySQL template/repository, set its runtime to Docker, and configure the following values.

| Setting | Staging example | Production approach |
|---|---|---|
| `MYSQL_DATABASE` | `sponsorbridge_staging` | `sponsorbridge_production` |
| `MYSQL_USER` | `sponsorbridge_app` | A distinct production app user |
| `MYSQL_PASSWORD` | Generate and store as a Render secret | Generate a different value and store as a Render secret |
| `MYSQL_ROOT_PASSWORD` | Generate and store separately | Generate a different value and store separately |
| Persistent disk | `/var/lib/mysql`, sized for the expected data plus backup/export headroom | Same mount path; increase size before it becomes tight |

Never make this service public. Copy its internal hostname/port from Render after deployment and form the application `DATABASE_URL` with the non-root app user.

### 4.3 Export, import, and verify data

For an initial test, use an anonymised or minimal staging dataset. For a real production cutover, schedule a short write freeze and use a fresh dump.

```bash
# Run from the current source database environment. Keep the output encrypted at rest.
mysqldump --single-transaction --routines --triggers \
  -h "$SOURCE_DB_HOST" -u "$SOURCE_DB_USER" -p \
  "$SOURCE_DB_NAME" > sponsorbridge-YYYYMMDD.sql
```

Import the dump through a trusted Render shell/SSH session or a controlled migration runner, then verify table counts and a small set of non-sensitive sample records. Store the dump only for the defined retention period and delete it securely afterwards.

### 4.4 Run Drizzle migrations deliberately

The project’s Drizzle configuration reads `DATABASE_URL` and uses the MySQL dialect. The current production Docker stage intentionally installs only production dependencies, while `drizzle-kit` is a development dependency. Therefore, do **not** assume `pnpm drizzle-kit migrate` will be available inside the runtime container.

Render supports a paid-service **pre-deploy command** for tasks such as database migrations. It runs after the build and before deployment; if it fails, the prior successful deploy remains active. [7] Before production, add and test a dedicated migration runner that is available in the pre-deploy environment—for example, a small application-owned migration script included in the production image. Keep it idempotent and make it the only process permitted to apply schema changes.

Do not put destructive schema changes, data backfills, or a database restore in the web-service start command.

## 5. Phase B — deploy staging web service

### 5.1 Create the staging service

In Render, select **New > Web Service**, connect `BigLittleBusiness/sponsorbridge`, and use these settings.

| Render setting | Value |
|---|---|
| Name | `sponsorbridge-staging-web` |
| Branch | `staging` |
| Runtime | `Docker` |
| Dockerfile | `./Dockerfile` |
| Root directory | Repository root |
| Region | The region closest to your first charity clients and operational team |
| Auto-deploy | **After CI Checks Pass** once the first manual deployment is proven |
| Health check path | `/api/health` |

The current Dockerfile already builds the application and runs `node dist/index.js`. Render uses the container `CMD` for Docker services unless you override it. [7] Render web services receive an injected `PORT`; SponsorBridge’s server must continue binding to that value rather than a fixed port.

### 5.2 Set staging environment variables

Use the **Environment** page in Render. Do not paste values into source control, GitHub issues, or `render.yaml`. [4]

| Variable | Staging value/source | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Use production behavior even in the staging deployment. |
| `DATABASE_URL` | Internal Render MySQL connection string | Use the app database user, not root. |
| `JWT_SECRET` | Unique generated secret | Must differ from all other environments. |
| `STRIPE_SECRET_KEY` | Stripe test secret key | Never use a live key in staging. |
| `STRIPE_WEBHOOK_SECRET` | Stripe test endpoint signing secret | Created after the staging webhook endpoint exists. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe test publishable key | Safe for the client, but environment-specific. |
| SES variables | Staging SES region, credentials, and verified sender | Use a controlled recipient mailbox while SES remains in sandbox. |
| S3/R2 variables | New storage adapter’s staging bucket, region/endpoint, access key, secret key, and public/CDN origin | Add only after the storage portability work is complete. |
| `APP_BASE_URL` or equivalent | `https://staging.yourdomain.com` | Add this explicit variable when updating email links, callback URLs, and Stripe return URLs. |

`BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, and other Manus-only values should not be part of the production Render environment. They should be removed from active production paths during the portability work.

### 5.3 Configure application health checks

Set Render’s HTTP health check path to `/api/health` after confirming that endpoint returns a fast `2xx` response without requiring browser authentication. Render uses health checks to determine when a new web-service instance is ready; a failed new deployment leaves the previous healthy version serving traffic. [5]

Prefer a lightweight application readiness check. If the endpoint checks MySQL, use a bounded, simple query and fail safely when the connection cannot be made.

## 6. Phase C — connect external services

### 6.1 Object storage

Refactor the existing Manus-specific `storagePut`, `storageGet`, and `/manus-storage/*` proxy before enabling staff image uploads. The replacement should:

| Requirement | Implementation target |
|---|---|
| Bucket isolation | A different bucket or unambiguous prefix for staging and production. |
| Upload authorisation | Server-generated, short-lived presigned PUT URLs or server-side upload validation. |
| File validation | Enforce image MIME type, maximum file size, and normalised filename/key server-side. |
| Delivery | A stable S3/R2 URL or application-generated signed GET URL, never a local Render filesystem path. |
| Browser policy | A bucket CORS policy limited to SponsorBridge staging/production origins. |
| Recovery | Lifecycle policy and versioning appropriate to child-protection and retention requirements. |

### 6.2 Stripe

After staging has its public Render URL, create a **test-mode** Stripe webhook endpoint at:

```text
https://staging.yourdomain.com/api/projects/webhook
```

The current project router documents this as the project-contribution webhook route. Enter the endpoint’s new signing secret in `STRIPE_WEBHOOK_SECRET`. Send a Stripe test event, complete a test one-off contribution, then complete a test recurring contribution. Confirm that the raw-body webhook verification succeeds, contribution records update once, and no event is double-counted.

Only after that test passes should you create the equivalent live-mode webhook endpoint for production. Use separate Stripe test and live keys; never reuse a signing secret between environments.

### 6.3 Email through SES

Verify the sending domain and a `noreply@` identity in SES. Start with a staging sender and recipient you control. Configure the application’s sender name/address and AWS region/credentials through Render secrets. Test the custom-auth flows, including portal access, password reset, payment receipt, and new update notification emails before placing the production endpoint behind the real domain.

## 7. Phase D — custom domains, HTTPS, and cookies

Add `staging.yourdomain.com` to the staging web service first. Render’s documented sequence is: add the domain in Render, configure the DNS record with your provider, then verify the domain in Render. Render handles TLS certificate issuance/renewal and redirects HTTP to HTTPS. [3]

Remove conflicting `AAAA` records while configuring a Render custom domain, because Render’s documentation warns they can produce unexpected behaviour. [3] Use the exact DNS target shown in the Render dashboard rather than guessing an A or CNAME destination.

Once staging is accepted, repeat the same process for `app.yourdomain.com` or the final canonical production hostname. Update these dependent settings at the same time:

1. The canonical application base URL used in emails and Stripe success/cancel redirects.
2. Stripe webhook endpoint URL.
3. Cookie domain and `Secure`/`SameSite` policy, if the custom-auth cookie configuration requires a domain override.
4. SES email links and any public campaign share URLs.
5. Object-storage CORS allowed origins.

Do not disable the Render `onrender.com` subdomain until the custom production domain has been verified and passes a complete smoke test. Render allows you to disable the default subdomain after a custom domain is working. [3]

## 8. Phase E — CI/CD and deployment control

SponsorBridge’s GitHub Actions workflow already runs TypeScript, unit tests, baseline browser smoke tests, and credentialed smoke tests against an ephemeral MySQL service. Keep this as the deployment gate.

In the Render service settings, select **After CI Checks Pass** for production auto-deploys. Render can detect GitHub Actions checks and deploy only after checks complete successfully. [7] Use `staging` for automatic staging deployments and `main` for production.

| Branch | Render service | Recommended policy |
|---|---|---|
| `staging` | `sponsorbridge-staging-web` | Auto-deploy after CI; test with Stripe and SES staging settings. |
| `main` | `sponsorbridge-production-web` | Auto-deploy after CI only after the launch checklist is stable. |
| Feature branches | None initially | Use preview/testing through local browser smoke runs and pull requests. |

Do not add a Render deploy-hook secret unless you have a concrete reason to bypass Render’s GitHub integration. Deploy hook URLs are themselves secrets and must be rotated if exposed. [8]

## 9. Production cutover runbook

Perform the production cutover during a low-activity window. Keep the existing application live until post-cutover acceptance succeeds.

| Step | Owner action | Pass condition |
|---|---|---|
| 1 | Confirm staging acceptance and export a fresh source backup. | Backup is encrypted and restoration has been rehearsed on staging. |
| 2 | Announce a short write freeze if existing production data is being migrated. | No new writes occur during the final export. |
| 3 | Export, import, and verify the final data set. | Record counts and selected tenant/sponsorship checks match the source. |
| 4 | Configure production secrets, S3/R2 production bucket, SES sender, Stripe live keys, and webhook secret. | No staging value appears in production. |
| 5 | Deploy production service and run migrations through the tested migration runner. | Render health check passes and deploy remains healthy. |
| 6 | Add/verify production custom domain and update Stripe webhook. | HTTPS is valid; Stripe test/live endpoint verification succeeds. |
| 7 | Run post-cutover smoke tests. | Public page, registration, staff login, sponsor login, admin login, update upload, Stripe test/live policy check, and email receipt all pass. |
| 8 | Monitor logs and key metrics before switching off the prior deployment. | No elevated 4xx/5xx, webhook, login, or upload errors. |

## 10. Rollback and recovery

Application rollback and database rollback are different operations.

| Scenario | Safe response |
|---|---|
| New application deploy fails health checks | Render keeps the previous successful application version serving traffic while the deploy fails. [5] Investigate and redeploy only after correction. |
| New application version has a functional defect | Use Render’s deploy history to redeploy the prior known-good commit, then open a corrective change. [7] |
| Migration has not run | Roll back the application; do not make speculative manual DB edits. |
| Destructive migration/data issue | Stop writes, restore from a verified `mysqldump` backup into a recovery database, validate it, and follow a documented recovery decision. Do not rely solely on a disk snapshot. [2] |
| Stripe webhook error | Leave the endpoint configured, inspect Stripe delivery attempts, correct configuration, and replay only confirmed safe events. |

Before any production schema change, require a tested restore path, an explicit owner, and a record of the exact backup used.

## 11. What not to do in the first Render launch

Avoid the following complexity until there is a demonstrated need:

1. Do not split the existing application into separate frontend and API services. The current server already serves the built React application.
2. Do not place MySQL on the public internet.
3. Do not store uploaded files on the Render web-service disk.
4. Do not run migrations in every application process startup.
5. Do not point GitHub Actions, staging, or browser test fixtures at production data.
6. Do not copy managed Manus Forge keys into Render.

## 12. Final acceptance checklist

The production deployment is ready only when every applicable item below is checked.

- [ ] Staging works on its custom HTTPS domain.
- [ ] All current baseline and credentialed browser smoke tests pass against staging.
- [ ] The production storage adapter uploads and retrieves a child/project update image from the production-compatible bucket.
- [ ] A Stripe test contribution and webhook update exactly one contribution record in staging.
- [ ] SES sends and receives the authentication and receipt messages in staging.
- [ ] Database dump restoration has been rehearsed.
- [ ] Production migrations have been tested against a staging copy.
- [ ] `app.yourdomain.com` (or your final hostname) is verified, HTTPS works, and cookie behaviour has been checked in a real browser.
- [ ] Render health check is `/api/health` and stays green after a redeploy.
- [ ] Render production auto-deploy is set to **After CI Checks Pass**.
- [ ] Monitoring/notifications have named owners for deploy failure, health failure, payment-webhook failure, and email failure.

## References

[1]: [Render — Deploy a Node Express App](https://render.com/docs/deploy-node-express-app)

[2]: [Render — Deploy MySQL](https://render.com/docs/deploy-mysql)

[3]: [Render — Custom Domains](https://render.com/docs/custom-domains)

[4]: [Render — Environment Variables and Secrets](https://render.com/docs/configure-environment-variables)

[5]: [Render — Health Checks](https://render.com/docs/health-checks)

[6]: [Render — Deploying on Render: Ephemeral filesystem and zero-downtime deploys](https://render.com/docs/deploys)

[7]: [Render — Deploying on Render: CI checks and pre-deploy commands](https://render.com/docs/deploys)

[8]: [Render — Deploy Hooks](https://render.com/docs/deploy-hooks)
