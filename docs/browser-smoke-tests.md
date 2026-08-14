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
| Organisation registration | Empty step-one submission produces clear validation feedback. |
| Sponsor portal | An unauthenticated sponsor-only route redirects to sponsor sign-in. |
| Staff projects | Project creation is hidden behind the staff sign-in gate. |
| Custom staff pages | Events redirects unauthenticated visitors to organisation login. |
| Public campaigns | A missing campaign slug shows a clear fallback rather than a blank screen. |
| Mobile | Early Access controls remain present at a 390px viewport. |

The GitHub Actions CI workflow installs Chromium, runs this suite after unit tests, and uploads the Playwright HTML report if the suite fails.
