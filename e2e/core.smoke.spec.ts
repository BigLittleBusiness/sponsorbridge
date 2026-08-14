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

  test("pricing annual toggle updates paid-plan pricing", async ({ page }) => {
    await page.goto("/pricing");

    await expect(page.getByRole("heading", { name: "Simple pricing for every organisation" })).toBeVisible();
    await page.getByRole("button", { name: /Annual/ }).click();

    await expect(page.getByText("$79/mo")).toBeVisible();
    await expect(page.getByText("$199/mo")).toBeVisible();
    await expect(page.getByText("billed annually").first()).toBeVisible();
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
});
