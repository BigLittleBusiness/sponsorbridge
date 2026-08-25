# SponsorBridge: Founder-to-Developer DigitalOcean Handover Checklist

**Purpose:** Use this checklist before a developer deploys SponsorBridge to DigitalOcean. It separates what the developer needs to do the work from the accounts, recovery controls, financial controls, and irreversible approvals that must remain with you as the founder.

> **Core rule:** Give a developer the minimum access needed to complete a defined stage of work. Never share your personal password, multi-factor authentication code, recovery code, personal email mailbox, or primary payment method.

## 1. Ownership model: what stays with you

You should be the original owner of every commercial account. A developer may be invited as a team member, but should not be the only owner, the only billing contact, or the only person able to recover access.

| Account or control | Keep personally | Why it matters | What the developer receives instead |
|---|---|---|---|
| DigitalOcean account and team | Primary owner email, password, MFA/recovery codes, payment method, invoices, billing alerts | DigitalOcean owners can manage resources, billing, team settings, and access. [1] | A **team member** invitation; promote temporarily only if a clearly defined task requires it. |
| Domain registrar | Registrar login, MFA, recovery codes, registrant contact, renewal payment | The domain controls your website and email routing. | Limited DNS access if the registrar supports it, or you make the approved DNS changes yourself. |
| GitHub organisation | Organisation owner status, billing, MFA/recovery, repository ownership | Source code, CI, and deployment history are business assets. GitHub supports granular repository roles. [2] | Maintain/write access to `BigLittleBusiness/sponsorbridge`, limited to the required repository. |
| Stripe account | Account owner/admin, MFA, bank account, payout details, live-mode authority | Payment keys, webhooks, refunds, and payouts are commercially sensitive. | A restricted Stripe team role, ideally test-mode-first; developer does not need payout access. |
| AWS / SES account | Root account email, MFA, recovery, billing, verified domain identities | SES affects brand email delivery and AWS costs. | A scoped IAM user/role for SES only; never AWS root credentials. |
| Password manager | Owner account, emergency access, recovery kit | This is the secure handover channel for scoped credentials. | A shared vault/folder with only the secrets required for the active deployment stage. |
| Source data and backups | Encrypted database/media backup location and recovery instructions | Child, sponsor, and operational data must remain recoverable independently of a developer. | Read-only access to a staging data copy or a time-limited migration export, when necessary. |

### Founder actions before inviting anyone

- [ ] Create the DigitalOcean account with your business email address, not a developer’s email.
- [ ] Enable MFA, store recovery codes in your password manager, and require secure sign-in for the DigitalOcean team. DigitalOcean allows owners to require team MFA. [3]
- [ ] Add a second trusted internal owner or recovery contact where your business structure allows it.
- [ ] Add a business payment method and create a monthly billing alert.
- [ ] Confirm that the domain registrar, GitHub organisation, Stripe account, AWS account, and password manager are all owned by your business email.
- [ ] Create a secure shared vault named `SponsorBridge — Deployment`.
- [ ] Record your desired production domain, staging domain, and DNS provider in the handover form below.

## 2. What you should never hand over directly

| Do not give the developer | Safer alternative |
|---|---|
| Your DigitalOcean, GitHub, Stripe, AWS, registrar, or email password | Invite them through the platform’s team/member system. |
| MFA codes, recovery codes, or device approval prompts | You approve sign-in yourself; use team access and short-lived/limited tokens. |
| AWS root credentials | Create a least-privilege IAM user or role limited to SES tasks. |
| Stripe live secret key by email, chat, or source code | Place it in the password manager vault or DigitalOcean encrypted runtime-secret field when you approve production setup. |
| A permanent full-admin DigitalOcean token | Use a scoped token only if required, store it in the vault, set an expiry reminder, and revoke it after setup. |
| Production database export through ordinary email or chat | Use an encrypted transfer location and document a deletion date. |
| Production child/sponsor data for test purposes | Provide a sanitised staging copy or dedicated test fixtures only. |

## 3. What to give the developer

Provide these items through the shared password-manager vault, a private issue tracker, or a secure meeting—not in public chat or a repository file.

### 3.1 Project and technical brief

- [ ] GitHub repository URL: `https://github.com/BigLittleBusiness/sponsorbridge`.
- [ ] Branch policy: `staging` deploys to staging; `main` deploys to production only after your approval.
- [ ] Current deployment runbooks:
  - `docs/digitalocean-cost-comparison-and-migration-guide.md`
  - `docs/render-deployment-guide.md`
  - `docs/browser-smoke-tests.md`
- [ ] Current target architecture: DigitalOcean App Platform, Managed MySQL, Spaces, Stripe, and SES.
- [ ] Required launch conditions: HTTPS, custom domain, database backup, Spaces media migration, Stripe webhook verification, SES sender test, browser smoke-test pass.
- [ ] Confirmation that child/sponsor data is sensitive and staging must not contain unapproved production copies.

### 3.2 Non-secret operational details

| Item | Example | Owner decision required? |
|---|---|---:|
| DigitalOcean team name | `SponsorBridge` | Yes |
| App Platform app names | `sponsorbridge-staging`, `sponsorbridge-production` | Yes |
| Database names | `sponsorbridge_staging`, `sponsorbridge_production` | Yes |
| Spaces buckets | `sponsorbridge-staging-media`, `sponsorbridge-production-media` | Yes |
| Primary region | Sydney/`syd1`, where available | Yes |
| Staging domain | `staging.yourdomain.com` | Yes |
| Production domain | `app.yourdomain.com` | Yes |
| Legal/privacy contact | A monitored business email address | Yes |
| Deployment window | Low-traffic scheduled period | Yes |

### 3.3 Secrets to place in the shared vault

| Secret or access item | Give to developer? | How to scope it |
|---|---:|---|
| DigitalOcean team invitation | Yes | Team Member first; increase role only with your written approval. |
| DigitalOcean API token | Only if needed | Create for a defined purpose; record owner, purpose, creation date, expiry/revocation date. |
| Staging MySQL connection information | Yes | Staging only; use managed database binding where possible. |
| Production MySQL connection information | Only during approved cutover | Time-limited access; remove after migration and validation. |
| Spaces access key/secret | Yes | Separate staging and production keys; limited to relevant bucket operations if available. |
| Stripe test keys | Yes | Test mode only until staging sign-off. |
| Stripe live keys/webhook secret | Only at production approval gate | Enter directly into DigitalOcean runtime secrets; do not keep in repository files. |
| SES scoped IAM credentials | Yes | SES-only permissions and verified identity; never root credentials. |
| `JWT_SECRET` | Developer may generate it | Store only as a DigitalOcean production secret and in the vault. |
| `E2E_TEST_PASSWORD` | Already held in GitHub secret | Do not send unless test-fixture reset is specifically required. |

## 4. Developer access: recommended permissions

### DigitalOcean

Invite the developer as a **Team Member** rather than sharing your login. DigitalOcean team owners can invite, revoke, and change member roles. [1]

| Stage | Recommended developer access | Founder approval required? |
|---|---|---:|
| Staging build | Team Member + staging secrets | No, after scope is agreed |
| Spaces adapter development | Team Member + staging Spaces credentials | No |
| Production infrastructure creation | Team Member; founder retains billing/ownership | Yes |
| Production database import | Time-limited production database access | Yes, immediately before migration |
| DNS and live Stripe webhook | Developer prepares changes; founder approves and/or performs final action | Yes |
| Post-launch support | Team Member; no standing owner access | Yes, review after launch |

### GitHub

Give the developer access only to the SponsorBridge repository. GitHub organisation owners can grant granular repository roles; avoid making a contractor an organisation owner. [2]

- [ ] Developer can create branches and pull requests.
- [ ] Protect `main` and require review before production deployment changes.
- [ ] Keep GitHub Actions secrets managed by you or a trusted internal owner.
- [ ] Require approval before workflow changes that add cloud credentials, change deployment targets, or access production data.

### Stripe and AWS SES

- [ ] Give Stripe test-mode access before live-mode access.
- [ ] Restrict the developer from payouts, banking, ownership, and broad account changes unless explicitly necessary.
- [ ] Create an AWS IAM user/role specifically for SES, restricted to the approved region and sending identity. AWS identifies access keys as long-term credentials; prefer the narrowest access and rotate/revoke when no longer needed. [4]
- [ ] Keep live Stripe and SES credentials out of GitHub source code and issue trackers.

## 5. Deployment approval gates

The developer can prepare each stage, but you should explicitly approve the following gates in writing—an email or issue-comment approval is sufficient.

| Gate | Developer delivers | You approve after checking |
|---|---|---|
| **A. Staging infrastructure** | Staging App Platform, Managed MySQL, Spaces bucket, health check | Cost estimate, region, names, no production data used |
| **B. Storage portability** | Spaces adapter, staging media migration report, sample uploads | Media is accessible only as intended; no broken child/project images |
| **C. Staging functional test** | Browser-smoke results, Stripe test event, SES test email | Staff, sponsor, admin, public campaign, payment, and email paths behave correctly |
| **D. Production readiness** | Backup plan, rollback plan, final secret inventory, change window | You have backups, recovery access, and understand cutover steps |
| **E. Live cutover** | DNS/HTTPS plan, Stripe webhook change, final data migration plan | Your written go/no-go approval |
| **F. Post-launch handover** | URLs, dashboard links, secret ownership list, backup verification, outstanding risks | You can access everything without the developer |

## 6. Founder launch-day checklist

- [ ] Confirm you can sign in to DigitalOcean, GitHub, domain registrar, Stripe, AWS, and the password manager without developer help.
- [ ] Confirm MFA works on each owner account.
- [ ] Confirm current invoices and billing alerts are visible to you.
- [ ] Confirm a recent encrypted database backup exists and the restore owner is named.
- [ ] Confirm Spaces media bucket, App Platform service, and Managed MySQL are in the intended environment and region.
- [ ] Confirm the staging application has passed the browser smoke suite.
- [ ] Confirm the live Stripe webhook URL and signing secret are correct.
- [ ] Confirm SES sender identity, reply-to address, and test email delivery.
- [ ] Approve the DNS/HTTPS change in writing.
- [ ] Save the production URL, DigitalOcean app URL, database dashboard link, Spaces bucket name, and incident contact list in your password manager.

## 7. Post-launch ownership and offboarding

Within one week of launch, review access together.

- [ ] Remove any temporary production database access granted for migration.
- [ ] Revoke temporary DigitalOcean API tokens and any unused Spaces keys.
- [ ] Rotate secrets if a developer had access to a production secret outside DigitalOcean’s encrypted settings.
- [ ] Confirm the developer is not the sole owner of any domain, app, GitHub workflow, Stripe webhook, SES identity, or backup.
- [ ] Retain a short handover record: what was deployed, where credentials live, current monthly cost, backup location, last restore test, and known risks.
- [ ] Schedule a quarterly owner review of access, billing, backups, and domain renewal.

## 8. Copy-and-complete handover form

Copy this section into your private project tracker and complete it before handing work to a developer.

```text
Business owner email:
Second recovery contact:
DigitalOcean team owner:
DigitalOcean billing alert amount:
Password-manager vault location:
GitHub organisation owner(s):
Domain registrar and owner email:
DNS provider:
Staging domain:
Production domain:
Chosen DigitalOcean region:
Staging App Platform app name:
Production App Platform app name:
Staging Managed MySQL name:
Production Managed MySQL name:
Staging Spaces bucket:
Production Spaces bucket:
Stripe account owner:
SES/AWS account owner:
Approved developer name and end date:
Required deployment window:
Production cutover approver:
Backup location and restore owner:
```

## References

[1]: [DigitalOcean — Teams and Team Membership](https://docs.digitalocean.com/platform/teams/) and [Manage Team Membership](https://docs.digitalocean.com/platform/teams/how-to/manage-membership/)

[2]: [GitHub — Repository Roles for an Organisation](https://docs.github.com/organizations/managing-user-access-to-your-organizations-repositories/repository-roles-for-an-organization)

[3]: [DigitalOcean — Require Secure Sign-In for Teams](https://docs.digitalocean.com/platform/teams/how-to/require-secure-sign-in/)

[4]: [AWS IAM — Manage Access Keys for IAM Users](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html)
