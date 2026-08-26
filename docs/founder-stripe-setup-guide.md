# SponsorBridge: Founder Stripe Setup Guide

This guide explains what **you** need to do in Stripe so SponsorBridge can accept project contributions and recurring monthly support. It keeps testing separate from real money and identifies the few items that must wait until SponsorBridge is hosted on its staging and production domains.

> **Important:** Do not place Stripe secret keys in email, chat, source code, or a spreadsheet. Store them only in your `SponsorBridge — Deployment` password-manager vault, then share the relevant entry with a developer when staging deployment begins.

## What SponsorBridge currently supports

SponsorBridge uses **Stripe Checkout**, so Stripe hosts the sensitive card-entry page. The application creates a Checkout session for a contributor, then records the completed contribution only after Stripe sends a signed webhook to SponsorBridge.

| Capability | Current SponsorBridge behaviour |
|---|---|
| One-off project contribution | Uses a Stripe Checkout payment session. |
| Monthly project support | Uses a Stripe Checkout subscription session with a monthly price. |
| Contribution confirmation | Webhook marks the contribution as succeeded and updates the project total. |
| Project funding status | A project can be marked funded after its goal is reached. |
| Webhook route | `POST https://<your-domain>/api/projects/webhook` |
| Required webhook events | `checkout.session.completed` and `invoice.paid` |
| Email receipts and update emails | **Not live yet.** Current project email functions are placeholders until SES is implemented. |
| Sponsor self-service billing portal | **Not live yet.** The visible “Manage in Stripe” path needs a Stripe Billing Portal implementation before promising card-update or cancellation self-service. |

## Before you start

Have these items available:

| You need | Why |
|---|---|
| Business email and legal entity details | Stripe verifies live accounts before they can accept money. [1] |
| ABN/ACN or the applicable registration details | Usually required during Australian business verification. |
| Bank account for payouts | Where live contribution funds will be paid. |
| Phone with authenticator app | For Stripe account security. |
| Your `SponsorBridge — Deployment` password-manager vault | Where keys and webhook secrets will be stored. |
| Staging and production domain decisions | Needed before the permanent Stripe webhook endpoints are configured. |

## Part A — Create and secure the Stripe account

### 1. Create the account under your business control

1. Go to [Stripe](https://dashboard.stripe.com/register).
2. Register using a business-controlled email address. Do not use a developer’s email.
3. Save the Stripe owner login in your private password-manager vault.
4. Enable two-step verification in your Stripe account security settings.
5. Add at least one trusted internal business person as a backup administrator only if they are authorised to access payouts and financial information.

**Done when:** You can sign in yourself with two-step verification and see the Stripe Dashboard.

### 2. Complete business activation before live payments

1. In the Stripe Dashboard, find **Activate your account** or **Complete account setup**.
2. Enter your legal business/organisation details exactly as they appear in official records.
3. Add the business address, contact information, and the details Stripe requests about what SponsorBridge sells or facilitates.
4. Add the bank account where live payouts should be sent.
5. Submit any identity or business verification requested by Stripe.
6. Review the Dashboard for pending requirements until Stripe indicates that live payments and payouts are enabled.

Stripe requires business verification to activate live Stripe services. [1]

**Do not switch SponsorBridge to live keys until account activation is complete.**

## Part B — Set up a safe testing environment first

Stripe’s testing environment is now described as a **sandbox** in its documentation. It is separate from live mode and does not process real card payments. [2]

### 3. Enter Stripe test mode / create a sandbox

1. Sign in to Stripe.
2. Use the Dashboard’s test/sandbox selector to enter the non-live environment.
3. Leave this environment selected while staging SponsorBridge is being built and tested.
4. In **Developers → API keys**, locate the test publishable key and test secret key.
5. Create entries in `SponsorBridge — Deployment` named:
   - `Stripe — SponsorBridge Staging`
   - `Stripe — SponsorBridge Production`
6. Put the test keys only in the **Staging** entry. Do not put live keys there.

### 4. Add the staging keys only after the staging app exists

When the DigitalOcean staging app is ready, its encrypted runtime variables will need these exact values:

| SponsorBridge variable | Stripe source | Where it belongs |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe test secret key | DigitalOcean **staging** encrypted runtime secret |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe test publishable key | DigitalOcean **staging** runtime variable |
| `STRIPE_WEBHOOK_SECRET` | Created after the staging webhook endpoint is added | DigitalOcean **staging** encrypted runtime secret |

> The `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are private. The publishable key is designed for browser use, but it should still be managed consistently through deployment configuration.

## Part C — Create the staging webhook

The webhook is critical. A successful browser redirect is not enough to safely confirm a contribution; SponsorBridge waits for Stripe’s signed server-to-server event.

### 5. Create the Stripe staging webhook endpoint

Do this only after `https://staging.sponsorbridge.com` is live over HTTPS.

1. In Stripe **test mode**, open **Developers → Webhooks** (or the Workbench Webhooks area).
2. Select **Add endpoint**.
3. Enter this endpoint URL exactly:

   ```text
   https://staging.sponsorbridge.com/api/projects/webhook
   ```

4. Select these events:
   - `checkout.session.completed`
   - `invoice.paid`
5. Save the endpoint.
6. Stripe will display an endpoint signing secret, usually beginning with `whsec_`.
7. Copy it straight into the `Stripe — SponsorBridge Staging` password-manager entry.
8. Add that value to the DigitalOcean staging app as `STRIPE_WEBHOOK_SECRET`.

Every webhook endpoint has its own signing secret; Stripe recommends verifying events using that secret. [3]

**Never use the staging webhook signing secret in production.**

## Part D — Test a complete contribution journey

### 6. Create a safe staging project

After the staging app is working, ask the developer to create one test project, for example:

```text
Title: SponsorBridge test well
Goal: A$100
Public: Yes, on staging only
Recurring contributions: Enabled
```

Do not use a real child, sponsor, donor, or beneficiary in this test project.

### 7. Test one-off and recurring contributions

1. Open the staging fundraising page in a private/incognito browser window.
2. Complete one **one-off** contribution using a Stripe-provided test card. Stripe documents test card details, including `4242 4242 4242 4242`, for use in test mode. [4]
3. Return to the SponsorBridge staff view and confirm that the contribution status becomes **succeeded** and the project total increases.
4. In Stripe test mode, open the relevant Checkout Session and confirm it was completed.
5. In Stripe test mode, open **Developers → Webhooks** and confirm that `checkout.session.completed` was delivered successfully.
6. Repeat the journey using the **monthly** option.
7. Confirm the subscription exists in Stripe test mode and that `invoice.paid` is delivered for the recurring-payment path.
8. Test a cancellation at Checkout and verify no succeeded contribution is created.

### 8. Test failure and duplicate-safety behaviour

Ask the developer to help with these two checks:

| Test | Expected result |
|---|---|
| Re-send the same Stripe test event from the Dashboard | SponsorBridge should not double-count the contribution. |
| Use a Stripe test card that simulates a declined payment | The contribution should remain pending/failed, not succeeded. |

**Done when:** Both payment types are tracked correctly in SponsorBridge and Stripe shows successful webhook deliveries.

## Part E — Prepare the live release

### 9. Complete these founder approvals before using live keys

- [ ] Stripe account activation is complete and payouts are enabled.
- [ ] Staging one-off and recurring tests have passed.
- [ ] The production app uses `https://app.sponsorbridge.com` over HTTPS.
- [ ] The production app’s public campaign and success/cancel links have been checked.
- [ ] The developer has confirmed webhook signature verification is enabled.
- [ ] You have decided who can access Stripe live-mode refunds, payouts, disputes, and account settings.
- [ ] You understand that real payments, refunds, chargebacks, and payout obligations begin in live mode.

### 10. Create separate live-mode credentials and webhook

1. Switch from test/sandbox mode to **live mode** in Stripe.
2. Go to **Developers → API keys** and copy the live publishable key and live secret key into the `Stripe — SponsorBridge Production` vault entry.
3. Go to **Developers → Webhooks** and create a new endpoint:

   ```text
   https://app.sponsorbridge.com/api/projects/webhook
   ```

4. Select the same two events:
   - `checkout.session.completed`
   - `invoice.paid`
5. Copy the new, separate live `whsec_...` signing secret into the **Production** vault entry.
6. With the developer, add the live values only to the **production** DigitalOcean App Platform service:

| Variable | Production value |
|---|---|
| `STRIPE_SECRET_KEY` | Live Stripe secret key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Live Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Live webhook endpoint signing secret |

7. Confirm staging continues to use only test keys and its own test webhook signing secret.

Stripe states that live mode processes real payments, while test keys and test cards must be used for testing. [4] [5]

## Part F — First live payment and ongoing controls

### 11. Run a controlled live launch check

1. Publish a small, real public project only after the production app, webhook, and storage checks pass.
2. Make one small genuine contribution using a payment method you control.
3. Confirm the Checkout success page appears.
4. Confirm the contribution becomes succeeded in SponsorBridge.
5. Confirm the matching event appears as delivered in Stripe Webhooks.
6. Confirm the payment appears in Stripe Payments and that your payout schedule is visible.
7. If anything differs, pause public promotion and investigate before accepting more contributions.

### 12. Monthly founder responsibilities

| Frequency | What to check |
|---|---|
| Weekly during launch | Failed webhook deliveries, failed payments, and unexpected refunds. |
| Monthly | Payouts, Stripe fees, disputes, refund activity, and user access. |
| Quarterly | Remove former staff/developers, review MFA, and rotate access if required. |

## Do not do these things

- Do not email or paste secret keys into chat.
- Do not test with real cards in live mode; Stripe prohibits this. [4]
- Do not reuse a webhook signing secret across staging and production.
- Do not turn on public fundraising until the production webhook has been tested.
- Do not assume an email receipt works yet; SponsorBridge’s SES email sender still needs implementation.
- Do not promise sponsors they can manage subscriptions in a Stripe portal until that feature has been implemented and tested.

## References

[1]: [Stripe — Set up your account](https://docs.stripe.com/get-started/account/set-up)

[2]: [Stripe — Sandboxes](https://docs.stripe.com/sandboxes)

[3]: [Stripe — Set up and deploy a webhook](https://docs.stripe.com/webhooks/quickstart)

[4]: [Stripe — Test card numbers and testing](https://docs.stripe.com/testing)

[5]: [Stripe — API keys](https://docs.stripe.com/keys)
