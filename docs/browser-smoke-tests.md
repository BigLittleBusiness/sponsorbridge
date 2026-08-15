# Browser Smoke Tests

SponsorBridge uses [Playwright](https://playwright.dev/) for a focused browser smoke suite. The suite deliberately avoids real payment processing and production credentials. It verifies public rendering, client-side validation, protected-route redirects, and key empty/error states in a real Chromium browser.

## Run locally

Install the browser once after installing project dependencies:

```bash
pnpm exec playwright install chromium
```

Then run the headless smoke suite:

```bash
pnpm test:smoke
```

## Credentialed non-production journeys

The credentialed suite provisions and uses three isolated identities in a **non-production database only**:

| Identity | Email | Coverage |
|---|---|---|
| Charity staff | `e2e.staff@sponsorbridge.test` | Custom sign-in and organisation dashboard access. |
| Sponsor | `e2e.sponsor@sponsorbridge.test` | Sponsor sign-in, safe linked child, and update-feed visibility. |
| System administrator | `e2e.admin@sponsorbridge.test` | Custom sign-in and System Administration access. |

Set a unique, 16+ character `E2E_TEST_PASSWORD` through secure environment configuration, then run:

```bash
pnpm test:smoke:authenticated
```

This command runs `pnpm e2e:seed` first. The seed is idempotent, uses the dedicated `e2e-sponsorbridge` tenant, and refuses to run when `NODE_ENV=production`. It never prints the password.

> **Safety requirement:** Set `DATABASE_URL` in local and GitHub Actions environments to a disposable non-production database. Do not configure these tests against a production database.

### Reset and CI setup

To reset the three test accounts after changing the secure password, update `E2E_TEST_PASSWORD` in the non-production environment and run `pnpm e2e:seed`. The seed refreshes the account hashes and safe linked fixtures without creating duplicate children, sponsorships, or updates.

For GitHub Actions, add the following **repository secrets** in the SponsorBridge repository settings:

| Secret | Value |
|---|---|
| `DATABASE_URL` | A dedicated, disposable non-production MySQL/TiDB database URL. |
| `E2E_TEST_PASSWORD` | The same unique strong password used by the non-production E2E accounts. |

CI runs the credentialed suite only when both secrets are present. The browser-test database must not contain production data.

For interactive debugging, run:

```bash
pnpm test:smoke:ui
```

The configuration starts SponsorBridge on port `4173` automatically. To test a separately running instance, set `PLAYWRIGHT_BASE_URL`:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm test:smoke
```

## Coverage

| Journey | Smoke assertion |
|---|---|
| Marketing | The landing-page hero and Early Access section load. |
| Early Access | Required fields, email-format feedback, and typed-value preservation work. |
| Pricing | Annual billing changes Growth and Scale prices. |
| Campaign preview | Pricing opens a clearly labelled, non-transactional donor-experience preview; donation controls remain disabled. |
| Conversion analytics | Pricing billing choice, tier CTAs, preview opens, and first comparison-table interaction send aggregate-only events. |
| Organisation registration | Empty step-one submission produces clear validation feedback. |
| Sponsor portal | An unauthenticated sponsor-only route redirects to sponsor sign-in. |
| Staff projects | Project creation is hidden behind the staff sign-in gate. |
| Custom staff pages | Events redirects unauthenticated visitors to organisation login. |
| Public campaigns | A missing campaign slug shows a clear fallback rather than a blank screen. |
| Mobile | Early Access controls remain present at a 390px viewport. |
| Mobile comparison | The table preserves readable columns through horizontal scrolling; the scroll hint respects reduced-motion preferences. |
| Credentialed staff | A dedicated charity staff account signs in and reaches the organisation dashboard. |
| Credentialed sponsor | A dedicated sponsor signs in and sees the safe sponsored-child fixture. |
| Credentialed administrator | A dedicated system-admin account signs in and accesses System Administration. |

The GitHub Actions CI workflow installs Chromium, runs the baseline suite after unit tests, and runs credentialed journeys only when both `DATABASE_URL` and `E2E_TEST_PASSWORD` are configured as repository secrets. It uploads the Playwright HTML report if either browser suite fails.
