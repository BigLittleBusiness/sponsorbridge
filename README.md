# SponsorBridge

**Purpose-built platform for child sponsorship charities.**

SponsorBridge gives smaller charities the same sophisticated tools that the world's largest child sponsorship organisations use — at a fraction of the cost. Multi-tenant, white-label, and built with child protection at its core.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui |
| API | Express 4, tRPC 11, Superjson |
| Database | MySQL / TiDB (Drizzle ORM) |
| Auth | Custom email/OTP + Manus OAuth |
| Payments | Stripe (Checkout + Webhooks) |
| Storage | S3-compatible object storage |
| Runtime | Node.js 22, TypeScript |
| Container | Docker (multi-stage build) |

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code. Protected — merge via PR only. Triggers production deploy to AWS. |
| `staging` | Pre-production integration testing. Triggers staging deploy to AWS. |
| `develop` | Integration branch. All feature branches merge here first. |
| `feature/marketing-site` | Homepage, pricing page, public navigation |
| `feature/platform-core` | Dashboard, children, sponsors, matching, payments, analytics |
| `feature/auth` | Login, register, OTP, forgot/reset password |
| `feature/branding` | SVG logo suite, favicon, email templates |

**Workflow:**
```
feature/* → develop → staging → main (production)
```

New features should branch from `develop` and open a PR back to `develop`. Once tested, `develop` is merged to `staging` for QA, then `staging` is merged to `main` for production release.

---

## CI/CD (GitHub Actions → AWS ECS)

Three workflows are defined in `.github/workflows/`:

| Workflow | Trigger | Action |
|---|---|---|
| `ci.yml` | Push/PR to any branch | TypeScript check, unit tests, production build |
| `deploy-staging.yml` | Push to `staging` | Build Docker image → push to ECR → deploy to ECS staging |
| `deploy-production.yml` | Push to `main` | Build Docker image → push to ECR → deploy to ECS production → create release tag |

### AWS Secrets Required

Add these to **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user access key with ECR push + ECS deploy permissions |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `DATABASE_URL` | MySQL connection string (RDS or PlanetScale) |
| `JWT_SECRET` | Session signing secret (min 32 chars, random) |
| `VITE_APP_ID` | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Manus OAuth backend URL |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL |
| `BUILT_IN_FORGE_API_URL` | Manus built-in API URL |
| `BUILT_IN_FORGE_API_KEY` | Manus built-in API key (server-side) |
| `VITE_FRONTEND_FORGE_API_KEY` | Manus built-in API key (frontend) |
| `VITE_FRONTEND_FORGE_API_URL` | Manus built-in API URL (frontend) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

### AWS Infrastructure Required (ECS)

Before the deploy workflows will succeed, provision the following in AWS (ap-southeast-2 recommended):

1. **ECR repository** named `sponsorbridge`
2. **ECS cluster** named `sponsorbridge-staging` and `sponsorbridge-production`
3. **ECS services** named `sponsorbridge-staging` and `sponsorbridge-production`
4. **ECS task definitions** named `sponsorbridge-staging` and `sponsorbridge-production` with container name `sponsorbridge-app`
5. **RDS MySQL** instance (or Aurora Serverless v2) for the database
6. **Application Load Balancer** routing HTTPS traffic to the ECS services
7. **IAM user** with `AmazonEC2ContainerRegistryPowerUser` + `AmazonECS_FullAccess` policies

### Production Approval Gate

The `production` GitHub Environment is configured to require manual approval before deploying to production. Set this up in **GitHub → Settings → Environments → production → Required reviewers**.

---

## Local Development

```bash
# Install dependencies
pnpm install

# Start dev server (frontend + backend on :3000)
pnpm dev

# Run tests
pnpm test

# Type-check
pnpm tsc --noEmit

# Generate DB migration after schema changes
pnpm drizzle-kit generate
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values. Never commit `.env` files.

Key variables:
- `DATABASE_URL` — MySQL connection string
- `JWT_SECRET` — Session signing secret
- `STRIPE_SECRET_KEY` — Stripe server-side key
- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe client-side key

---

## Deployment

The application is containerised via the `Dockerfile` at the project root. The multi-stage build produces a lean production image (~200 MB).

```bash
# Build locally
docker build -t sponsorbridge .

# Run locally
docker run -p 3000:3000 --env-file .env sponsorbridge
```

For AWS deployment, push to the `staging` or `main` branch and the GitHub Actions workflows handle the rest.
