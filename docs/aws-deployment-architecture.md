# SponsorBridge — AWS Deployment Architecture

This document describes the recommended AWS infrastructure for hosting SponsorBridge in production, with particular attention to the secure handling of child-related media (vlogs, profile photos) and compliance with GDPR and COPPA requirements.

---

## Architecture Overview

```
                        ┌─────────────────────────────────────────────────────┐
                        │                   AWS Cloud                         │
                        │                                                     │
  Users / Charities     │  ┌──────────┐    ┌──────────────────────────────┐  │
  ─────────────────►    │  │CloudFront│───►│  ALB (Application Load       │  │
                        │  │  (CDN)   │    │  Balancer)                   │  │
                        │  └──────────┘    └──────────────┬───────────────┘  │
                        │       │                         │                  │
                        │       │ Static assets           │ API traffic      │
                        │       ▼                         ▼                  │
                        │  ┌──────────┐    ┌──────────────────────────────┐  │
                        │  │  S3      │    │  ECS Fargate (Node.js app)   │  │
                        │  │  (UI +   │    │  - Express + tRPC server     │  │
                        │  │  Media)  │    │  - Auto-scaling (2–10 tasks) │  │
                        │  └──────────┘    └──────────────┬───────────────┘  │
                        │                                 │                  │
                        │                    ┌────────────┼────────────┐     │
                        │                    ▼            ▼            ▼     │
                        │              ┌──────────┐ ┌──────────┐ ┌────────┐ │
                        │              │  Aurora  │ │ElastiCache│ │  SES   │ │
                        │              │ MySQL    │ │  Redis   │ │ (Email)│ │
                        │              │Serverless│ │(Sessions)│ │        │ │
                        │              └──────────┘ └──────────┘ └────────┘ │
                        └─────────────────────────────────────────────────────┘
```

---

## Service Breakdown

### Compute — ECS Fargate

| Setting | Value |
|---|---|
| Launch type | Fargate (serverless containers) |
| Container image | Node.js 22 Alpine (built from project Dockerfile) |
| CPU / Memory | 1 vCPU / 2 GB per task |
| Min tasks | 2 (for high availability across AZs) |
| Max tasks | 10 (auto-scale on CPU > 70%) |
| Port | 3000 (internal); ALB handles 443 externally |

The Node.js server serves both the Express API and the Vite-built React SPA from the same process, matching the current development setup exactly.

---

### Database — Amazon Aurora MySQL Serverless v2

| Setting | Value |
|---|---|
| Engine | Aurora MySQL 8.0 compatible |
| Mode | Serverless v2 (scales 0.5–8 ACUs) |
| Multi-AZ | Yes (automated failover) |
| Encryption | AES-256 at rest (AWS KMS) |
| Backup retention | 35 days |
| Connection | Via `DATABASE_URL` environment variable (same as dev) |

The existing Drizzle ORM schema and migrations apply without modification. Run `pnpm drizzle-kit migrate` during the CI/CD deployment pipeline.

---

### Media Storage — Amazon S3 (Two Buckets)

SponsorBridge uses a **two-bucket strategy** to separate public marketing assets from sensitive child-related media.

#### Bucket 1: `sponsorbridge-public-assets`
- **Purpose:** Marketing images, UI assets, logos, branding files
- **Access:** Public read via CloudFront distribution
- **Encryption:** SSE-S3
- **Lifecycle:** No expiry (permanent)

#### Bucket 2: `sponsorbridge-private-media`
- **Purpose:** Child profile photos, vlog videos, safeguarding documents, consent forms
- **Access:** **Private only** — no public access, no public ACLs
- **Encryption:** SSE-KMS (customer-managed key)
- **Lifecycle:** Transition to Glacier after 2 years; delete after 7 years (configurable per jurisdiction)
- **Access method:** Pre-signed URLs generated server-side with 15-minute expiry
- **EXIF stripping:** Applied at upload via Lambda trigger before storage
- **Virus scanning:** Applied at upload via Lambda trigger (ClamAV or AWS Malware Protection)

```typescript
// Server-side pre-signed URL generation (already in server/storage.ts)
// For AWS production, replace the Manus storage helper with:
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function getSecureMediaUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_PRIVATE_MEDIA_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn: 900 }); // 15 minutes
}
```

---

### Email — Amazon SES

| Setting | Value |
|---|---|
| Purpose | OTP verification, onboarding sequences, sponsor updates |
| Region | Same as primary deployment region |
| Sending domain | `mail.sponsorbridge.com` (DKIM + SPF + DMARC required) |
| From address | `noreply@sponsorbridge.com` |
| Bounce handling | SNS topic → Lambda → database flag |

**Migration from Nodemailer (dev) to SES (prod):**

```typescript
// In server/customAuth.ts, replace the nodemailer transporter with:
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: process.env.AWS_REGION });

export async function sendOtpEmail(to: string, otp: string) {
  await ses.send(new SendEmailCommand({
    Source: "noreply@sponsorbridge.com",
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: "Your SponsorBridge verification code" },
      Body: { Text: { Data: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.` } },
    },
  }));
}
```

---

### Session Cache — ElastiCache Redis

| Setting | Value |
|---|---|
| Purpose | JWT session store, OTP rate limiting, onboarding state |
| Engine | Redis 7.x |
| Mode | Cluster mode disabled (single-shard, Multi-AZ with replica) |
| Encryption | In-transit (TLS) + at-rest |
| TTL | Sessions: 7 days; OTPs: 10 minutes |

The current JWT cookie approach works without Redis, but Redis is recommended for production to enable instant session revocation (critical for safeguarding incidents).

---

### CDN — Amazon CloudFront

| Distribution | Origin | Cache behaviour |
|---|---|---|
| `sponsorbridge.com` | ALB (API + SPA) | API paths (`/api/*`): no cache; SPA: cache with revalidation |
| `assets.sponsorbridge.com` | S3 public bucket | Long TTL (1 year) with content-hash filenames |

CloudFront also handles:
- SSL/TLS termination (ACM certificate)
- DDoS protection (AWS Shield Standard, included)
- WAF rules (block known bad actors, rate limiting on `/api/auth/*`)

---

### Environment Variables for AWS Production

Add these to ECS Task Definition environment (via AWS Secrets Manager):

```env
# Database
DATABASE_URL=mysql://user:pass@aurora-cluster.cluster-xxx.us-east-1.rds.amazonaws.com:3306/sponsorbridge

# Auth
JWT_SECRET=<256-bit random secret from Secrets Manager>

# AWS
AWS_REGION=ap-southeast-2
AWS_PRIVATE_MEDIA_BUCKET=sponsorbridge-private-media
AWS_PUBLIC_ASSETS_BUCKET=sponsorbridge-public-assets

# Email (SES)
AWS_SES_FROM_EMAIL=noreply@sponsorbridge.com

# Stripe (existing)
STRIPE_SECRET_KEY=<from Stripe dashboard>
STRIPE_WEBHOOK_SECRET=<from Stripe webhook config>

# Redis
REDIS_URL=rediss://sponsorbridge.xxx.cache.amazonaws.com:6379
```

---

### CI/CD Pipeline — GitHub Actions → ECR → ECS

```yaml
# .github/workflows/deploy.yml (recommended structure)
on:
  push:
    branches: [main]
jobs:
  deploy:
    steps:
      - Build Docker image
      - Push to Amazon ECR
      - Run database migrations (pnpm drizzle-kit migrate)
      - Update ECS service (rolling deployment, zero downtime)
      - Run smoke tests against staging
      - Promote to production
```

---

### Security Hardening Checklist

- [ ] Enable AWS GuardDuty (threat detection)
- [ ] Enable AWS CloudTrail (API audit logging — maps to SponsorBridge's immutable audit requirement)
- [ ] S3 private bucket: Block all public access, enable Object Lock for safeguarding documents
- [ ] RDS: Disable public access, VPC-only, security group allows ECS tasks only
- [ ] WAF: Rate-limit `/api/auth/register` and `/api/auth/verify-otp` (max 5 req/min per IP)
- [ ] Secrets Manager: Rotate JWT_SECRET every 90 days
- [ ] KMS: Separate CMK for child media bucket (enables key rotation and access revocation)
- [ ] VPC: ECS tasks in private subnets, NAT Gateway for outbound, no direct internet access

---

### Estimated Monthly Cost (Growth-tier charity, ~500 sponsors)

| Service | Estimated cost |
|---|---|
| ECS Fargate (2 tasks × 1 vCPU / 2 GB) | ~$60/month |
| Aurora MySQL Serverless v2 (0.5–2 ACU) | ~$40/month |
| S3 (50 GB media + 5 GB assets) | ~$5/month |
| CloudFront (100 GB transfer) | ~$10/month |
| SES (10,000 emails) | ~$1/month |
| ElastiCache (cache.t4g.micro) | ~$15/month |
| ALB | ~$20/month |
| **Total** | **~$150/month** |

This is well within the $99/month Growth tier revenue per charity, making the infrastructure cost-positive from the first customer.

---

*Last updated: July 2026. Review annually or when AWS pricing changes.*
