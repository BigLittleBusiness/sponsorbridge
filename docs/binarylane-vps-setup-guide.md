# SponsorBridge BinaryLane VPS Setup Guide

**Target:** BinaryLane Sydney Linux VPS — 2 vCPU, 4 GB RAM, 60 GB NVMe

**Purpose:** This guide deploys SponsorBridge as a single production application on a secure VPS using Docker Compose. It is designed for an early launch, not a high-availability enterprise environment.

## 1. What this setup includes

| Component | Purpose | Where it runs |
|---|---|---|
| Caddy | Public HTTPS gateway and automatic TLS certificate renewal | Docker container on the VPS |
| SponsorBridge app | React website, Express API, custom staff/sponsor login, tRPC, and Stripe webhook handlers | Docker container on the VPS |
| MySQL 8.4 | Application database | Docker volume on the VPS |
| Object storage | New child and project-update images | External S3-compatible provider |
| Amazon SES | Product email once the email sender is implemented | External AWS service |
| Stripe | Hosted payment collection and webhooks | External Stripe service |

The Compose configuration in this repository keeps MySQL and the application private inside Docker. Only Caddy exposes ports **80** and **443** to the internet. BinaryLane provides a VPS, not a managed application platform; you remain responsible for operating-system updates, firewall rules, monitoring, and independent backups. [1] [2]

> **Do not store uploaded images on the VPS disk.** The supplied portable storage adapter stores new uploads in an S3-compatible bucket. The VPS disk should contain application code, MySQL’s local database volume, Caddy certificates, and short-term encrypted backup staging only.

## 2. Before buying or creating anything

Complete these founder actions first.

| Item | Required decision |
|---|---|
| VPS plan | Select the BinaryLane Sydney **4 GB / 2 vCPU / 60 GB NVMe** Linux VPS. |
| Operating system | Select **Ubuntu 24.04 LTS**. |
| Primary domain | `app.sponsorbridge.com`. |
| Founder email | Use your named Big Little Business mailbox for BinaryLane, GitHub, Stripe, SES, alerts, and certificate notices. |
| Object storage | Choose a production S3-compatible bucket outside the VPS. Cloudflare R2, Amazon S3, and DigitalOcean Spaces are compatible. |
| Backup destination | Choose a separate offsite bucket/account before storing customer data. BinaryLane backups alone are not sufficient. |
| Maintenance window | Set a recurring monthly 30-minute review for alerts, operating-system updates, backup restore checks, and billing. |

## 3. Create and secure the BinaryLane VPS

### Step 1 — Provision the server

In BinaryLane, create the Sydney 4 GB Ubuntu 24.04 VPS. Add your SSH public key during creation if BinaryLane offers that option. Save the server’s public IPv4 address in your password manager under `SponsorBridge — Deployment`.

Enable BinaryLane’s automated backup option as a **secondary recovery layer**. BinaryLane states that its automatic backups are stored separately in the same data centre and are not encrypted at rest; retain an independent offsite backup destination as well. [3]

### Step 2 — Configure the BinaryLane external firewall

Create an external firewall and attach it to the SponsorBridge VPS. Allow only the following inbound traffic:

| Port | Protocol | Source | Reason |
|---|---|---|---|
| 22 | TCP | Your current public IP address only | SSH administration |
| 80 | TCP | Anywhere | Initial HTTPS certificate validation and HTTP-to-HTTPS handling |
| 443 | TCP | Anywhere | SponsorBridge HTTPS traffic |

Do **not** expose ports 3000, 3306, 5432, or Docker’s internal networks. If your home internet IP changes frequently, update the port-22 source rule before attempting to connect. BinaryLane recommends its external firewall and limiting exposed ports. [2]

### Step 3 — Connect and create a non-root deploy user

From a terminal on your own computer, connect with the login details BinaryLane provides. Then run the following commands exactly once, substituting a real user name for `deploy`:

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo mkdir -p /home/deploy/.ssh
sudo cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

Log out, then confirm you can sign in as `deploy`. Only after confirming that, edit `/etc/ssh/sshd_config` to set `PermitRootLogin no`, restart SSH with `sudo systemctl restart ssh`, and keep your existing session open until the new login is confirmed.

Apply operating-system updates and install baseline protections:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl git ufw fail2ban unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

Use the BinaryLane external firewall as the primary ingress control. UFW is a defence-in-depth layer only:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from YOUR_CURRENT_PUBLIC_IP to any port 22 proto tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

### Step 4 — Install Docker Engine and Compose

Install Docker Engine and the Docker Compose plugin using Docker’s current official Ubuntu instructions. After installation, allow the `deploy` user to operate Docker and sign out/in again:

```bash
sudo usermod -aG docker deploy
docker version
docker compose version
```

Do not install a web-control panel, a second web server, or a second MySQL server. Caddy, the app, and MySQL are already defined in `docker-compose.production.yml`.

## 4. Prepare SponsorBridge for the VPS

### Step 5 — Clone the release and create secure environment files

On the VPS, clone the SponsorBridge repository under `/opt` and lock its ownership to the deploy user:

```bash
sudo mkdir -p /opt/sponsorbridge
sudo chown deploy:deploy /opt/sponsorbridge
git clone https://github.com/BigLittleBusiness/sponsorbridge.git /opt/sponsorbridge
cd /opt/sponsorbridge
git checkout main
cp ops/.env.production.example ops/.env.production
cp ops/.env.backup.example ops/.env.backup
chmod 600 ops/.env.production ops/.env.backup
```

If the repository is private, create a **read-only GitHub deploy key** for this server rather than placing a founder personal-access token in the repository URL. Keep the private key readable only by the `deploy` user.

### Step 6 — Complete `ops/.env.production`

Open the file with `nano ops/.env.production`. Replace every `replace_me` value. Do not paste this file into chat, email, GitHub, or a ticket.

| Variable group | What to enter |
|---|---|
| `APP_DOMAIN` | `app.sponsorbridge.com` |
| `APP_BASE_URL` | `https://app.sponsorbridge.com` |
| `ACME_EMAIL` | Your named business email for certificate expiry notices |
| `JWT_SECRET` | A new random 64-character secret: `openssl rand -hex 32` |
| `SCHEDULER_SECRET` | A different random 64-character secret: `openssl rand -hex 32` |
| `MYSQL_*` | Three separate long random values for root, app-user, and app-database settings |
| `DATABASE_URL` | The supplied internal Compose URL, with the app-user password URL-encoded if necessary |
| `STRIPE_*` | Leave test keys in staging; use live keys only after final Stripe approval |
| `S3_*` | Credentials, endpoint, region, and private media bucket for your chosen object storage provider |
| `LEGACY_MANUS_STORAGE_ORIGIN` | Keep temporarily while old `/manus-storage/*` content is migrated; remove only after verification |

Generate a random database password with `openssl rand -base64 36`. If it includes characters such as `@`, `:`, `/`, `?`, or `#`, URL-encode the password in `DATABASE_URL` while leaving `MYSQL_PASSWORD` unchanged.

The new portable storage adapter uses `STORAGE_DRIVER=s3` and returns app-relative `/media/...` URLs. Caddy proxies them to SponsorBridge, which produces a short-lived signed object-storage download URL. Keep the bucket private and grant the app only the permission to read and write this one bucket.

> **Media-access limitation:** The current `/media/...` proxy preserves the existing link-based access behaviour: anyone who is given a valid media URL can receive a short-lived download redirect. Keep the object-storage bucket private, use hard-to-guess object keys, and treat this as an interim model. Before storing media that must be restricted to a particular staff member or sponsor, add tenant- and sponsorship-aware authorisation to the media proxy.

### Step 7 — Prepare object storage

Create two buckets in the object-storage provider: one for staging and one for production. For production, use a name such as `sponsorbridge-production-media`. Disable public listing, block public write access, and create an access key limited to that bucket.

New images will use the portable storage adapter immediately. Existing `/manus-storage/*` media should be copied to the new bucket in a controlled migration before removing `LEGACY_MANUS_STORAGE_ORIGIN`. Keep the Manus application available until the asset migration list, object count, and sampled image checks have been signed off.

## 5. First deployment

### Step 8 — Start MySQL and run database migrations once

Do not start the web app before the schema is current. From `/opt/sponsorbridge`, run:

```bash
docker compose --env-file ops/.env.production -f docker-compose.production.yml up -d db
docker compose --env-file ops/.env.production -f docker-compose.production.yml --profile maintenance run --rm migrate
```

The MySQL initialisation variables only apply when the `mysql-data` Docker volume is new. Do not change `MYSQL_DATABASE`, `MYSQL_USER`, or `MYSQL_PASSWORD` after the first production start without following a deliberate credential-rotation process.

### Step 9 — Start the application and HTTPS gateway

```bash
docker compose --env-file ops/.env.production -f docker-compose.production.yml up -d --build app caddy
docker compose --env-file ops/.env.production -f docker-compose.production.yml ps
docker compose --env-file ops/.env.production -f docker-compose.production.yml logs --tail=100 app caddy
```

At this point the app health check should report successfully inside Docker, but public HTTPS will not finish until DNS is configured.

### Step 10 — Point the Panthur DNS record

In Panthur DNS management, create an **A** record:

| Field | Value |
|---|---|
| Host / Name | `app` |
| Type | `A` |
| Value | BinaryLane VPS public IPv4 address |
| TTL | 300 or the provider default |

Do not edit MX, SPF, DKIM, DMARC, or unrelated website records. Do not add an AAAA record until IPv6 connectivity has been tested.

When DNS resolves, Caddy obtains and renews the TLS certificate automatically. Verify the public health endpoint after DNS propagation:

```bash
curl -fsS https://app.sponsorbridge.com/api/health
```

Expected result:

```json
{"status":"ok","service":"sponsorbridge"}
```

## 6. Configure scheduled backups and onboarding work

### Step 11 — Enable daily database backup

The supplied backup script creates a compressed MySQL export at 02:15 server time, validates the archive, retains 14 days locally, and can optionally copy the archive to an offsite S3-compatible bucket. Install and enable the timer:

```bash
sudo install -m 0750 ops/backup-sponsorbridge.sh /opt/sponsorbridge/ops/backup-sponsorbridge.sh
sudo install -m 0644 ops/sponsorbridge-backup.service /etc/systemd/system/sponsorbridge-backup.service
sudo install -m 0644 ops/sponsorbridge-backup.timer /etc/systemd/system/sponsorbridge-backup.timer
sudo systemctl daemon-reload
sudo systemctl enable --now sponsorbridge-backup.timer
systemctl list-timers sponsorbridge-backup.timer
```

Run one manual backup before launch:

```bash
sudo /opt/sponsorbridge/ops/backup-sponsorbridge.sh
```

Test restoration to a separate temporary MySQL database before you rely on backups. A backup has no value until a restore has succeeded.

### Step 12 — Enable the onboarding scheduler only after email is ready

The original onboarding handler trusts Manus cron sessions. The deployment kit adds a second, constant-time-checked scheduler secret for the VPS. Install the timer after Amazon SES sending is working:

```bash
sudo install -m 0644 ops/sponsorbridge-onboarding.service /etc/systemd/system/sponsorbridge-onboarding.service
sudo install -m 0644 ops/sponsorbridge-onboarding.timer /etc/systemd/system/sponsorbridge-onboarding.timer
sudo systemctl daemon-reload
sudo systemctl enable --now sponsorbridge-onboarding.timer
systemctl list-timers sponsorbridge-onboarding.timer
```

The timer calls the internal application container only; it does not open another public port.

## 7. Stripe and email

### Step 13 — Keep staging and live payment settings separate

Use Stripe test keys while validating staging. Once `app.sponsorbridge.com` is serving HTTPS, configure these Stripe webhook endpoints in live mode:

```text
https://app.sponsorbridge.com/api/stripe/webhook
https://app.sponsorbridge.com/api/projects/webhook
```

Copy the signing secret for `/api/stripe/webhook` into `STRIPE_CHILD_WEBHOOK_SECRET` and the distinct signing secret for `/api/projects/webhook` into `STRIPE_PROJECT_WEBHOOK_SECRET`. Use Stripe-hosted Checkout; never store card details in SponsorBridge or MySQL.

### Step 14 — Configure email deliberately

Amazon SES is the recommended transactional sender. Verify `sponsorbridge.com`, publish the SES DNS records at Panthur, request production access, and configure a real sender such as `noreply@sponsorbridge.com`.

The current project includes email templates and logging stubs, but the SES sender implementation must be completed before password resets, receipts, and update emails will be delivered. Do not enable the onboarding scheduler until a controlled test email has arrived in a monitored inbox.

## 8. Ongoing operations

### Normal release procedure

Run releases from an approved GitHub commit. Take a fresh backup before every schema-changing release.

```bash
cd /opt/sponsorbridge
git fetch origin
git checkout main
git pull --ff-only origin main
docker compose --env-file ops/.env.production -f docker-compose.production.yml build app
docker compose --env-file ops/.env.production -f docker-compose.production.yml --profile maintenance run --rm migrate
docker compose --env-file ops/.env.production -f docker-compose.production.yml up -d app caddy
docker compose --env-file ops/.env.production -f docker-compose.production.yml logs --tail=100 app
curl -fsS https://app.sponsorbridge.com/api/health
```

### Monthly founder review

| Check | What “good” looks like |
|---|---|
| BinaryLane billing | Expected plan and backup charges only |
| Backups | Recent local and offsite backups exist; one restore has been tested quarterly |
| Firewall | Only ports 22, 80, and 443 are exposed; SSH source is restricted |
| Docker status | `docker compose ps` shows healthy app and database containers |
| Logs | No repeating errors in `docker compose logs --since 24h app` |
| Updates | Ubuntu security updates and approved SponsorBridge releases are current |
| Credentials | No former staff/developer retains SSH, GitHub, Stripe, SES, or storage access |

### Rollback procedure

If a release fails after migration, stop and assess before rolling back code. Database migrations can be irreversible. Restore the previous application image or Git commit only after confirming its schema compatibility. For data recovery, restore the latest verified backup to a **separate temporary database first**, inspect it, then schedule the production recovery window.

## 9. Launch acceptance checklist

- [ ] `https://app.sponsorbridge.com/api/health` returns `status: ok`.
- [ ] HTTPS certificate is valid and HTTP does not expose the app directly.
- [ ] Staff login, sponsor login, and system-admin checks pass.
- [ ] A child/project update image uploads and displays from portable object storage.
- [ ] Stripe test webhook succeeds in staging; live Stripe webhook succeeds only after founder approval.
- [ ] Password reset, receipt, and project-update email delivery are verified after SES wiring is complete.
- [ ] A database backup and restore test has been completed.
- [ ] Neither port 3000 nor 3306 is reachable from the public internet.
- [ ] Old Manus media URLs have either been migrated or are deliberately retained with a dated removal plan.

## References

[1]: [BinaryLane — Linux VPS](https://www.binarylane.com.au/vps-hosting/linux-vps)
[2]: [BinaryLane — Securing your servers](https://support.binarylane.com.au/support/solutions/articles/11000128211-securing-your-servers)
[3]: [BinaryLane — Automated backups](https://support.binarylane.com.au/support/solutions/articles/11000033794-automated-backups)
[4]: [Caddy — Automatic HTTPS](https://caddyserver.com/docs/automatic-https)
[5]: [Docker — Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
