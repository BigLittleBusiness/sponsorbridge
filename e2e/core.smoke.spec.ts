import { expect, test } from "@playwright/test";

test.describe("SponsorBridge core browser smoke tests", () => {
  test("marketing page renders and validates the Early Access form", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "The platform that empowers child sponsorship charities." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Get early access before we open the doors." })).toBeVisible();

    await page.getByRole("button", { name: "Get Early Access" }).click();
    await expect(page.getByText("Please enter your first name.")).toBeVisible();
    await expect(page.getByText("Please enter your email address.")).toBeVisible();

    await page.getByLabel("First name").fill("Smoke Test");
    await page.getByLabel("Email address").fill("not-an-email");
    await page.getByRole("button", { name: "Get Early Access" }).click();

    await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
    await expect(page.getByLabel("First name")).toHaveValue("Smoke Test");
    await expect(page.getByLabel("Email address")).toHaveValue("not-an-email");
  });

  test("marketing comparison presents the expanded sponsorship offer", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Project & item campaign sponsorship", { exact: true })).toBeVisible();
    await expect(page.getByText("Public fundraising pages with social sharing", { exact: true })).toBeVisible();
    await expect(page.getByText("Recurring monthly project contributions", { exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Feature comparison" })).toBeVisible();
  });

  test("pricing annual toggle updates paid-plan pricing", async ({ page }) => {
    await page.goto("/pricing");

    await expect(page.getByRole("heading", { name: "Simple pricing for every organisation" })).toBeVisible();
    await page.getByRole("button", { name: /Annual/ }).click();

    await expect(page.getByText("$79/mo")).toBeVisible();
    await expect(page.getByText("$199/mo")).toBeVisible();
    await expect(page.getByText("billed annually").first()).toBeVisible();
  });

  test("pricing campaign preview illustrates the donor journey and emits aggregate conversion events", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __conversionEvents: Array<{ name: string; properties?: Record<string, unknown> }> }).__conversionEvents = [];
      window.umami = {
        track: (name, properties) => {
          (window as unknown as { __conversionEvents: Array<{ name: string; properties?: Record<string, unknown> }> }).__conversionEvents.push({ name, properties });
        },
      };
    });

    await page.goto("/pricing");
    await page.getByRole("button", { name: /Annual/ }).click();
    await page.getByRole("button", { name: "View live campaign preview" }).click();

    await expect(page).toHaveURL(/\/campaign-preview$/);
    await expect(page.getByRole("heading", { name: "Clean water for Mtoni Primary School" })).toBeVisible();
    await expect(page.getByText("Donation controls are disabled in this illustrative preview.")).toBeVisible();

    const events = await page.evaluate(() => (window as unknown as { __conversionEvents: Array<{ name: string; properties?: Record<string, unknown> }> }).__conversionEvents);
    expect(events).toContainEqual({ name: "pricing_billing_toggle", properties: { billing_period: "annual" } });
    expect(events).toContainEqual({ name: "pricing_campaign_preview_clicked", properties: { placement: "project_campaign_callout" } });
  });

  test("organisation registration blocks an empty first step", async ({ page }) => {
    await page.goto("/register");

    await page.getByRole("button", { name: "Next — Organisation details" }).click();
    await expect(page.getByText("First name is required")).toBeVisible();
    await expect(page.getByText("Last name is required")).toBeVisible();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
  });

  test("sponsor-only screens redirect unauthenticated visitors to sponsor sign-in", async ({ page }) => {
    await page.goto("/sponsor/dashboard");

    await expect(page).toHaveURL(/\/sponsor\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in to your portal" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in with a magic code" })).toBeVisible();
  });

  test("staff project creation is protected by a sign-in gate", async ({ page }) => {
    await page.goto("/projects/new");

    await expect(page.getByRole("heading", { name: "Sign in to SponsorBridge" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "New Project" })).not.toBeVisible();
  });

  test("custom-auth staff routes redirect unauthenticated visitors to login", async ({ page }) => {
    await page.goto("/events");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in to your account" })).toBeVisible();
  });

  test("missing public campaign resolves to a clear fallback state", async ({ page }) => {
    await page.goto("/fund/smoke-test-missing-campaign");

    await expect(page.getByText("Campaign not found", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Go Home" })).toBeVisible();
  });
});

test.describe("SponsorBridge mobile smoke test", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Early Access controls remain available on a mobile viewport", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByLabel("First name")).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByRole("button", { name: "Get Early Access" })).toBeVisible();
  });

  test("comparison table keeps readable columns through horizontal scrolling", async ({ page }) => {
    await page.goto("/");

    const comparison = page.getByRole("region", { name: "Feature comparison" });
    await expect(comparison).toBeVisible();
    await expect(page.getByText("Swipe sideways to compare every column")).toBeVisible();
    expect(await comparison.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  });

  test("comparison scroll tracking is aggregate-only and the motion hint respects reduced motion", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __conversionEvents: Array<{ name: string; properties?: Record<string, unknown> }> }).__conversionEvents = [];
      window.umami = {
        track: (name, properties) => {
          (window as unknown as { __conversionEvents: Array<{ name: string; properties?: Record<string, unknown> }> }).__conversionEvents.push({ name, properties });
        },
      };
    });

    await page.goto("/");
    const comparison = page.getByRole("region", { name: "Feature comparison" });
    await comparison.evaluate((element) => {
      element.scrollLeft = 24;
      element.dispatchEvent(new Event("scroll", { bubbles: true }));
    });
    await expect.poll(async () => page.evaluate(() => (window as unknown as { __conversionEvents: Array<{ name: string }> }).__conversionEvents.map((event) => event.name))).toContain("marketing_comparison_interacted");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    const animationName = await page.getByText("Swipe sideways to compare every column").evaluate((element) => getComputedStyle(element).animationName);
    expect(animationName).toBe("none");
  });
});
