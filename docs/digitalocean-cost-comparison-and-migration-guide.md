# SponsorBridge: Hosting Cost Comparison and DigitalOcean Migration Guide

**Prepared for SponsorBridge.** This document compares the practical first-production monthly costs of Render, DigitalOcean App Platform, and a basic AWS deployment, defines the exact work required to replace current Manus-specific storage with DigitalOcean Spaces, and provides a staged DigitalOcean migration plan.

> **Recommendation:** For SponsorBridge’s first production release, use **DigitalOcean App Platform (1 GiB) + Managed MySQL (1 GiB) + Spaces**, while retaining Stripe and SES as external managed services. It is not the absolute lowest-dollar arrangement, but it is the strongest early-stage balance of cost, MySQL portability, object storage, and operational simplicity.

## 1. Cost assumptions and important exclusions

All figures below are **planning estimates in USD**, followed by an illustrative Australian-dollar conversion using **US$1 = A$1.55**. That exchange rate is a budgeting assumption, not a live FX quote. Australian GST, domain registration, Stripe transaction fees, SES email usage, unusual data transfer, paid support, incident response, and engineering time are excluded.

The comparison assumes a small but real multi-tenant launch: one always-on application instance, one MySQL database, persisted media, HTTPS, and no high-availability database replica. It does **not** assume a free tier, because SponsorBridge processes sponsor, child, payment, and operational data.

| Component | Baseline assumption |
|---|---|
| Application | One Node/Express service serving the built React client. |
| Database | One small MySQL instance with at least 10 GiB of storage. |
| Media | Project and child update images stored externally. |
| Email | SES remains external and usage-based. |
| Payments | Stripe remains external and transaction-based. |
| Region | Choose the closest region available to the operating team and initial clients; confirm exact regional pricing before purchase. |

## 2. Monthly operating-cost comparison

### 2.1 Initial production baseline

| Provider | Application | MySQL | Object storage | Estimated monthly cost (USD) | Illustrative monthly cost (AUD) | Operational observation |
|---|---:|---:|---:|---:|---:|---|
| **Render** | Starter web service: $7 | Starter private MySQL service: $7 | 30 GiB disk: $7.50 | **$21.50** | **A$33.33** | Lowest initial infrastructure cost, but MySQL is self-managed in a private service rather than a managed MySQL product. |
| **DigitalOcean — minimum** | App Platform 512 MiB: $5 | Managed MySQL 1 GiB: $15.15 | Spaces: $5 | **$25.15** | **A$38.98** | Suitable only if measured memory usage proves the 512 MiB service is stable. |
| **DigitalOcean — recommended** | App Platform 1 GiB: $10 | Managed MySQL 1 GiB: $15.15 | Spaces: $5 | **$30.15** | **A$46.73** | Recommended early-production configuration for SponsorBridge. |
| **Basic AWS** | EC2 plus EBS | Single-AZ RDS MySQL plus storage | S3 | **$45–55** | **A$69.75–85.25** | Region- and configuration-sensitive estimate; excludes an ALB, NAT Gateway, and multi-AZ, each of which can materially increase cost. |

The Render estimate is derived from its current $7 Starter web-service and $7 Starter private-service rates plus $0.25/GB-month disk storage. [1] Render’s MySQL guide confirms that it uses a private Docker service and a persistent disk rather than a managed MySQL product. [2]

DigitalOcean’s App Platform currently offers a 512 MiB shared container at $5/month and a 1 GiB shared container at $10/month. [3] Its smallest Managed MySQL plan is listed at $15.15/month, and Spaces starts at $5/month with 250 GiB of storage and 1,024 GiB of outbound transfer. [4] [5]

The AWS range is deliberately broad. AWS charges by region, instance class, database instance-hours, provisioned storage, backups, requests, and transfer. AWS explicitly directs users to its Pricing Calculator for a region-specific RDS estimate. [6] [7] A basic EC2/RDS design can be competitive only when kept intentionally simple; once a load balancer, NAT Gateway, Multi-AZ RDS, CloudWatch retention, or a second application instance are added, AWS commonly becomes the most expensive of the three for a young SaaS.

### 2.2 What changes the result

| Trigger | Render impact | DigitalOcean impact | AWS impact |
|---|---|---|---|
| Application needs more than 512 MiB | Move from $7 Starter to $25 Standard. [1] | Move from $5 to $10 or $12 shared 1 GiB, then $25 shared 2 GiB. [3] | Resize EC2; cost changes by instance type and region. |
| MySQL needs 2 GiB | Move to $25 private service, plus disk. [1] | Managed MySQL rises to $30.45/month. [4] | Resize RDS and storage independently. [6] |
| High availability needed | Requires architecture changes beyond a single self-managed private MySQL service. | Add Managed MySQL standby nodes; cost increases with additional nodes. [4] | Multi-AZ RDS creates and maintains standby capacity. [6] |
| Media grows beyond launch | Disk expands at $0.25/GB-month. [1] | Spaces adds $0.02/GiB-month after the included 250 GiB. [5] | S3 storage, requests, and transfer are independently metered. [7] |

### 2.3 Decision

For a bootstrapped Australian launch, the recommended DigitalOcean configuration is approximately **A$47/month before GST and external services**. That is only roughly A$13/month above the slim Render baseline, while avoiding the operational risk of running the production MySQL engine yourself. It is materially simpler than AWS while preserving S3-compatible storage and a conventional MySQL architecture.

## 3. Exact DigitalOcean Spaces changes required in SponsorBridge

SponsorBridge’s current storage implementation is **not portable**. It calls the Manus Forge API to obtain presigned URLs and exposes returned files via `/manus-storage/*`. The following changes are necessary before App Platform can serve media reliably.

### 3.1 Current dependency map

| Current location | Current responsibility | Required change |
|---|---|---|
| `server/storage.ts` | Calls Forge to obtain presigned PUT URLs; returns `/manus-storage/<key>`. | Rewrite as a direct DigitalOcean Spaces adapter using the existing `@aws-sdk/client-s3` dependency. |
| `server/_core/storageProxy.ts` | Redirects `/manus-storage/*` through Forge. | Delete or retire after data migration; returned URLs must be direct Spaces/CDN or signed Spaces URLs. |
| `server/_core/index.ts` | Imports and registers `registerStorageProxy(app)`. | Remove the import and registration after the proxy is retired. |
| `server/_core/env.ts` | Only exposes Forge storage configuration. | Add Spaces configuration and validation. |
| `server/routers.ts` and `server/routers/projects.ts` | Child and project update upload procedures call `storagePut`. | Keep the existing router contracts; the rewritten `storagePut` should preserve `{ key, url }`. |
| `server/customAuth.ts` and `server/sponsorAuth.ts` | Email templates embed a logo at a `manus.space/manus-storage/...` URL. | Replace with a stable Spaces CDN/custom-domain logo URL. |

### 3.2 Required environment variables

Add the following values to `server/_core/env.ts`, then configure them as encrypted runtime secrets in DigitalOcean App Platform. Do **not** send any Spaces credentials to the browser.

| Variable | Example | Purpose |
|---|---|---|
| `DO_SPACES_KEY` | Secret | Spaces access key with the smallest practical bucket scope. |
| `DO_SPACES_SECRET` | Secret | Spaces secret key. |
| `DO_SPACES_REGION` | `syd1` or chosen region | Records the bucket region for URLs and operations. |
| `DO_SPACES_ENDPOINT` | `https://syd1.digitaloceanspaces.com` | Explicit S3-compatible endpoint. |
| `DO_SPACES_BUCKET` | `sponsorbridge-production-media` | Production media bucket name. |
| `DO_SPACES_PUBLIC_BASE_URL` | `https://sponsorbridge-production-media.syd1.cdn.digitaloceanspaces.com` | Canonical public/CDN media origin, or a custom media domain later. |
| `APP_BASE_URL` | `https://app.yourdomain.com` | Needed for email links, Stripe return URLs, and canonical share links during portability work. |

DigitalOcean Spaces is S3-compatible. Its official JavaScript guidance specifies a custom region endpoint, `region: "us-east-1"` for AWS SDK validation, and `forcePathStyle: false`; the actual DigitalOcean region is determined by the endpoint. [8]

### 3.3 Replace `server/storage.ts`

Keep the exported function signatures so existing upload routers do not need to change. Replace the Forge request/redirect model with a server-side `S3Client`, `PutObjectCommand`, and direct URL construction.

```ts
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ENV } from "./_core/env";

const spaces = new S3Client({
  endpoint: ENV.spacesEndpoint,
  region: "us-east-1",
  forcePathStyle: false,
  credentials: {
    accessKeyId: ENV.spacesKey,
    secretAccessKey: ENV.spacesSecret,
  },
});

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
) {
  const key = appendHashSuffix(normalizeKey(relKey));
  const body = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  await spaces.send(new PutObjectCommand({
    Bucket: ENV.spacesBucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));

  return { key, url: `${ENV.spacesPublicBaseUrl}/${encodeURIComponent(key)}` };
}
```

The final implementation should URL-encode each key path segment safely, validate `DO_SPACES_PUBLIC_BASE_URL`, reject unknown MIME types and oversized files before upload, and record errors without printing credentials. Current image uploads travel from the browser to the server as base64 and the server writes to storage, so **browser PUT CORS is not required in the current flow**. Do not broaden the Spaces CORS policy to permit public PUT uploads unless the application is intentionally redesigned around browser-direct presigned uploads.

### 3.4 Remove the proxy and replace stored URLs

After a successful media migration:

1. Remove `registerStorageProxy` from `server/_core/index.ts`.
2. Remove `server/_core/storageProxy.ts` only after a post-migration scan confirms no persisted `/manus-storage/` URL remains.
3. Replace the hard-coded email logo URLs in `server/customAuth.ts` and `server/sponsorAuth.ts` with the Spaces CDN/custom media URL.
4. Scan all `mediaUrl`, `imageUrl`, and email-template URL fields. Existing child and project update records retain strings, so old URLs must be transformed in the database after their objects are copied.

### 3.5 Safe media migration procedure

| Step | Required action |
|---|---|
| 1 | Take and verify a MySQL backup before modifying URLs. |
| 2 | Produce a report of all records whose URL contains `/manus-storage/` or the existing Manus domain. |
| 3 | Download each source object while the existing environment remains accessible. |
| 4 | Upload it to the appropriate staging Spaces bucket using the exact logical key or a documented replacement key. |
| 5 | Verify the new object’s content length, MIME type, and a sample browser load. |
| 6 | Update that database URL only after successful verification. |
| 7 | Keep a mapping report of old URL, new URL, content type, record ID, and timestamp. |
| 8 | Repeat against production only after staging migration and rollback rehearsal pass. |

For a first implementation, use an application-owned script such as `scripts/migrate-manus-media-to-spaces.mjs`. It must be resumable, idempotent, dry-run by default, and refuse `NODE_ENV=production` unless an explicit acknowledgement flag is supplied.

### 3.6 CORS, privacy, and lifecycle policy

Use a private-by-default approach for any sensitive content. Public campaign imagery can be served from a public/CDN path; safeguarding attachments or restricted content should use private object keys plus short-lived signed GET URLs. Enable Spaces versioning/lifecycle rules if the organisation’s retention requirements call for them, and restrict CORS to the exact staging and production domains only when browser-origin access is genuinely needed.

## 4. DigitalOcean App Platform + Managed MySQL migration guide

### Phase A — pre-flight and staging

1. **Create a DigitalOcean project** named `SponsorBridge` and set a billing alert before creating services.
2. **Choose separate staging and production resources.** Use different Managed MySQL clusters, Spaces buckets, Stripe modes, SES senders, and secrets.
3. **Create a staging Managed MySQL cluster** with the 1 GiB plan. DigitalOcean lists this configuration at $15.15/month with 10–30 GiB storage. [4]
4. **Create a staging Space** such as `sponsorbridge-staging-media`. Enable the CDN only for content that is intentionally public.
5. **Implement and test the Spaces adapter** described in Section 3 before importing material data.
6. **Create a staging database** and apply all existing Drizzle migrations using a controlled migration runner. Do not run schema changes implicitly in the normal web-server start command.

### Phase B — create the staging App Platform application

1. In App Platform, create a new app from `BigLittleBusiness/sponsorbridge`, pointing to the `staging` branch.
2. Configure the web component to build from the existing `Dockerfile`. App Platform supports Dockerfile-based deployments. [9]
3. Start with the **1 GiB shared container**. The smaller 512 MiB plan is available, but should only be used after measured memory testing. [3]
4. Set `NODE_ENV=production` and add all staging secrets through the control panel. App Platform treats bound database information as runtime environment variables; map those safely into SponsorBridge’s required `DATABASE_URL`. [10]
5. Set the service health check to the already-existing `/api/health` endpoint.
6. Confirm the process binds to the platform-provided `PORT`; do not hard-code port `3000` in deployed configuration.

### Phase C — database connection and migration discipline

DigitalOcean App Platform can bind a managed database and inject connection information at runtime. [10] SponsorBridge expects a MySQL connection string in `DATABASE_URL`, so create or map a TLS-enabled connection string from the DigitalOcean database values and verify it with a single staging health check.

The current Docker runner intentionally excludes development dependencies, while `drizzle-kit` is a development dependency. Before deployment, add a dedicated migration command that is available in a controlled deployment job or maintenance environment. The safe sequence is:

1. Build the image.
2. Run the dedicated migration job exactly once against staging.
3. Verify migrations and table counts.
4. Deploy the application image.
5. Never let every web instance attempt migrations on startup.

### Phase D — configure external services

| Service | Staging configuration | Production configuration |
|---|---|---|
| Spaces | Test bucket and restricted access keys | Production bucket, separate access keys, documented lifecycle/retention rules. |
| Stripe | Test publishable key, secret key, and webhook signing secret | Live equivalents, created only after staging checkout/webhook success. |
| SES | Verified staging sender and controlled recipient mailbox | Verified production domain/identity and appropriate SES production access. |
| Custom domain | `staging.yourdomain.com` | `app.yourdomain.com` or chosen canonical hostname. |

The production Stripe project webhook remains:

```text
POST https://app.yourdomain.com/api/projects/webhook
```

Do not update the live Stripe webhook until production DNS, HTTPS, and health checks pass.

### Phase E — custom domain and launch checks

1. Add the staging custom domain in App Platform and set its DNS record exactly as DigitalOcean instructs.
2. Verify HTTPS, staff login, sponsor login, system-admin login, public campaign preview, project updates, and image rendering.
3. Add the live Stripe test webhook to staging and complete a test one-off and recurring project contribution.
4. Run the existing baseline and credentialed browser suites against staging once their base URL is parameterised for the staging hostname.
5. Import production data only after rehearsal on a staging copy succeeds.

### Phase F — production cutover

| Cutover step | Pass condition |
|---|---|
| Freeze writes briefly if importing existing production data | Final MySQL dump timestamp is recorded. |
| Import and migrate | Counts for tenants, accounts, sponsors, children, sponsorships, payments, updates, and projects are reconciled. |
| Copy media to Spaces | Migration report has no failed objects or unresolved Manus URLs. |
| Configure production secrets | No test/staging secret is present in production. |
| Deploy App Platform web service | `/api/health` is healthy and logs show no startup errors. |
| Configure custom domain and Stripe webhook | HTTPS works; Stripe endpoint verifies with live configuration. |
| Run acceptance suite | Public, staff, sponsor, admin, upload, email, and payment workflows pass. |

### Phase G — rollback

App Platform’s paid tier retains up to ten revisions for rollbacks. [3] Application rollback is not a database rollback. Before every production migration, keep an encrypted `mysqldump` backup, document the migration ID, and rehearse restore on a staging database. If the application release fails, roll back the application revision. If a destructive data migration fails, stop writes and restore into a separate recovery database before choosing a controlled recovery procedure.

## 5. What stays outside DigitalOcean initially

Keep Stripe and SES external. Do not add a queue, Redis, or a separate worker until observed load requires it. The Manus Forge dependencies for LLM, image generation, maps, data APIs, notifications, transcription, and Heartbeat are separate portability work items; they should be inventoried and either removed, disabled, or replaced with explicit providers before the external deployment is treated as complete.

## 6. Recommended next implementation sequence

1. Implement and test the Spaces storage adapter in a local/staging branch.
2. Add an idempotent media migration script and migrate staging media.
3. Add a portable migration runner for Drizzle.
4. Create DigitalOcean staging App Platform, Managed MySQL, and Spaces resources.
5. Run the existing credentialed browser suite against the staging hostname.
6. Test SES and Stripe test mode.
7. Complete a production cutover rehearsal before touching live DNS or live Stripe configuration.

## References

[1]: [Render Pricing](https://render.com/pricing)

[2]: [Render — Deploy MySQL](https://render.com/docs/deploy-mysql)

[3]: [DigitalOcean — App Platform Pricing](https://www.digitalocean.com/pricing/app-platform)

[4]: [DigitalOcean — Managed Databases Pricing](https://www.digitalocean.com/pricing/managed-databases)

[5]: [DigitalOcean — Spaces Pricing](https://docs.digitalocean.com/products/spaces/details/pricing/)

[6]: [AWS — Amazon RDS for MySQL Pricing](https://aws.amazon.com/rds/mysql/pricing/)

[7]: [AWS — Amazon EC2 On-Demand Pricing](https://aws.amazon.com/ec2/pricing/on-demand/) and [Amazon S3 Pricing](https://aws.amazon.com/s3/pricing/)

[8]: [DigitalOcean — Use Spaces with AWS S3 SDKs](https://docs.digitalocean.com/products/spaces/reference/aws-sdks/)

[9]: [DigitalOcean — App Platform Introduction](https://docs.digitalocean.com/products/app-platform/details/intro-faq/)

[10]: [DigitalOcean — App Platform Environment Variables](https://docs.digitalocean.com/products/app-platform/how-to/use-environment-variables/)
