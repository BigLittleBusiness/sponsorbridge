# SponsorBridge: Manus Domain, Email, and Stripe Launch Guide

This guide covers the three founder actions needed to prepare SponsorBridge for an initial launch on Manus: connecting `app.sponsorbridge.com`, preparing transactional email, and enabling Stripe live payments.

> **Use this order:** Domain first, then email preparation, then Stripe live mode. Do not switch Stripe to live keys until the production domain is working over HTTPS.

## 1. Connect `app.sponsorbridge.com` to Manus

Manus can host the current SponsorBridge project directly. The project is already published on its temporary Manus address; adding your custom domain simply gives it the professional address `app.sponsorbridge.com`.

### What you need

You need access to the SponsorBridge project in Manus and to the DNS records for `sponsorbridge.com` at Panthur. You **do not** need to change nameservers or move the domain away from Panthur.

### Steps in Manus

1. Open the SponsorBridge project.
2. Open the right-hand management panel and select **Settings**.
3. Select **Domains**.
4. Choose the option to connect an existing custom domain.
5. Enter exactly:

   ```text
   app.sponsorbridge.com
   ```

6. Manus will show the DNS record needed to verify and route the domain. It will normally be an **A record** or a **CNAME record**.
7. Keep that Manus screen open and copy the record details exactly. Do not guess or substitute a value.

### Steps in Panthur

1. Sign in to the Panthur customer portal.
2. Open the management page for `sponsorbridge.com`.
3. Find **DNS management**, **DNS records**, or **Zone editor**.
4. Add the exact record Manus provided.
5. For the host/name field, use `app` if Panthur automatically appends `.sponsorbridge.com`; otherwise use the exact host shown by Manus.
6. Leave all existing MX, TXT, SPF, DKIM, and DMARC records unchanged.
7. Save the record.

Return to Manus and wait for it to verify the DNS record. When verification completes, Manus provisions HTTPS automatically. Custom domain connection requires adding the DNS record supplied by Manus, and SSL/TLS is provisioned after connection. [1] [2]

### Check that it is complete

- [ ] `https://app.sponsorbridge.com` opens SponsorBridge without a certificate warning.
- [ ] The address bar shows the secure padlock.
- [ ] Sign-in, registration, and a public campaign page load from the custom domain.
- [ ] You have not changed Panthur nameservers or removed mail-related DNS records.

## 2. Prepare email sending with Amazon SES

SponsorBridge currently has email templates and notification points, but the application’s actual sending function is still a placeholder. Creating an SES identity now prepares the sender domain; the application needs a small implementation update before it can send production email.

### Recommended setup

Use **Amazon SES in Sydney** (`ap-southeast-2`) and verify the full domain `sponsorbridge.com`. Domain verification lets you send from addresses such as `noreply@sponsorbridge.com` without verifying each sender individually. [3]

Use SES for **transactional** messages such as account verification, password resets, contribution confirmations, and project updates. SES is an outbound email service; it does not create a mailbox for reading `support@sponsorbridge.com`. Keep or create a normal mailbox service for support replies.

### Steps in AWS SES

1. Sign in to your AWS account and open **Amazon SES**.
2. Select region **Asia Pacific (Sydney)** before creating anything. SES settings and verified identities are regional. [3]
3. If shown, select **Get started** and follow the SES setup wizard.
4. Open **Configuration → Identities → Create identity**.
5. Choose **Domain** and enter:

   ```text
   sponsorbridge.com
   ```

6. Keep **Easy DKIM** enabled and create the identity.
7. SES will show three DKIM CNAME records, and may show a verification TXT record.
8. In Panthur DNS management, add every record exactly as SES displays it. These records coexist with the `app` record you added for Manus.
9. Wait for the SES identity status to become **Verified**.

> Do not add a new SPF record if Panthur already has one. An SPF policy must be a single combined TXT record; merge a new sender only after checking the existing policy.

### Request SES production access

New SES accounts are in a sandbox: they can send only to verified recipients and have low sending limits. [4]

1. In the SES console, open **Account dashboard**.
2. Select **View Get set up page**, then **Request production access**.
3. Choose **Transactional** as the mail type.
4. Enter `https://app.sponsorbridge.com` as the website URL once the domain is live.
5. Add your business email as the contact.
6. Confirm that messages are sent only after a recipient has requested or legitimately expects them.
7. Submit the request and wait for SES review.

### What will be needed in SponsorBridge

After the SES identity is verified, I can wire the existing email templates to SES. The application should then receive these encrypted project secrets through **SponsorBridge → Settings → Secrets**:

| Secret | Value source |
|---|---|
| `AWS_REGION` | `ap-southeast-2` |
| `SES_FROM_EMAIL` | Usually `noreply@sponsorbridge.com` |
| `AWS_ACCESS_KEY_ID` | A dedicated least-privilege IAM credential for sending SES email |
| `AWS_SECRET_ACCESS_KEY` | The paired IAM secret access key |

Do not send these values by email or put them in source code. The app should use the SES API; that is the recommended route for SponsorBridge. SMTP is possible but would require separate SMTP credentials, hostname, and a code change to add an SMTP mail library. SES SMTP credentials are region-specific and distinct from AWS secret access keys. [5]

## 3. Enable Stripe live payments and webhooks

SponsorBridge supports Stripe Checkout for one-off and monthly project contributions. It records contributions after a signed webhook is received, so the webhook is essential.

### Step 1: finish Stripe account activation

1. Sign in to Stripe with a business-owned account.
2. Complete **Activate your account** with the organisation’s legal details and payout bank account.
3. Enable two-step verification.
4. Keep current testing in Stripe test/sandbox mode until the staging and domain checks pass.

Stripe uses separate test/sandbox and live keys; live keys process real payments. [6]

### Step 2: collect the live API keys

Do this only after `https://app.sponsorbridge.com` is HTTPS-enabled and you are ready to accept real contributions.

1. In Stripe, switch to **live mode**.
2. Open **Developers → API keys**.
3. Copy the live publishable key and live secret key.
4. Store them in your `SponsorBridge — Deployment` password-manager vault, labelled **Production**.
5. Add them in SponsorBridge **Settings → Secrets**:

| SponsorBridge secret | Stripe value |
|---|---|
| `STRIPE_SECRET_KEY` | Live secret key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Live publishable key |

### Step 3: create the production webhook

1. In Stripe **live mode**, open **Developers → Webhooks**.
2. Select **Add endpoint**.
3. Enter exactly:

   ```text
   https://app.sponsorbridge.com/api/projects/webhook
   ```

4. Select these two events:
   - `checkout.session.completed`
   - `invoice.paid`
5. Save the endpoint.
6. Copy its signing secret (it begins `whsec_`).
7. Add it to SponsorBridge **Settings → Secrets** as:

   ```text
   STRIPE_WEBHOOK_SECRET
   ```

Each webhook endpoint has its own signing secret, which is used to verify that events really came from Stripe. [7]

### Step 4: run a controlled go-live test

1. Publish one small real campaign.
2. Make one low-value real contribution using a payment method you control.
3. Confirm the Checkout completion screen appears.
4. Confirm the project total and contribution status update in SponsorBridge.
5. In Stripe, check that the webhook delivery succeeded.
6. Confirm the payment appears in Stripe Payments.
7. If these checks fail, pause public promotion and keep investigating before accepting further payments.

## Your immediate checklist

| Order | Founder action |
|---:|---|
| 1 | In Manus, start the custom-domain process for `app.sponsorbridge.com` and copy the exact DNS record it provides. |
| 2 | Add that record at Panthur; do not change nameservers or remove existing records. |
| 3 | In AWS SES Sydney, create a domain identity for `sponsorbridge.com` and add the provided DKIM records at Panthur. |
| 4 | Request SES production access after the domain identity is verified. |
| 5 | Complete Stripe account activation and retain test/sandbox mode while staging is checked. |
| 6 | After the production domain works, create the Stripe live webhook and add the three Stripe secrets in SponsorBridge. |
| 7 | Ask me to wire SES email sending and run the end-to-end production test before public launch. |

## References

[1]: [Manus — Custom domains](https://manus.im/docs/website-builder/custom-domains)

[2]: [Manus — Publishing](https://manus.im/docs/website-builder/publishing)

[3]: [AWS — Creating and verifying identities in Amazon SES](https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html)

[4]: [AWS — Request production access for Amazon SES](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html)

[5]: [AWS — Obtaining SES SMTP credentials](https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html)

[6]: [Stripe — API keys](https://docs.stripe.com/keys)

[7]: [Stripe — Set up and deploy a webhook](https://docs.stripe.com/webhooks/quickstart)
