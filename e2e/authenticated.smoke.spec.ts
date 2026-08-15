import { expect, test, type Page } from "@playwright/test";

const password = process.env.E2E_TEST_PASSWORD;
const hasCredentials = Boolean(password);

async function signInAsOrganisation(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign In" }).click();
}

test.describe("SponsorBridge credentialed non-production smoke tests", () => {
  test.skip(!hasCredentials, "E2E_TEST_PASSWORD is required for credentialed browser journeys.");

  test("staff can sign in and reach the organisation dashboard", async ({ page }) => {
    await signInAsOrganisation(page, "e2e.staff@sponsorbridge.test");

    await expect(page).toHaveURL(/\/org-dashboard$/);
    await expect(page.getByText("Dashboard", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("E2E Staff", { exact: true })).toBeVisible();
  });

  test("sponsor can sign in and view the sponsored-child dashboard", async ({ page }) => {
    await page.goto("/sponsor/login");
    await page.getByLabel("Email address").fill("e2e.sponsor@sponsorbridge.test");
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL(/\/sponsor\/dashboard$/);
    await expect(page.getByRole("heading", { name: /Welcome back, E2E/ })).toBeVisible();
    await expect(page.getByText("E2E Student", { exact: true })).toBeVisible();
  });

  test("system administrator can sign in and open system administration", async ({ page }) => {
    await signInAsOrganisation(page, "e2e.admin@sponsorbridge.test");
    await expect(page).toHaveURL(/\/org-dashboard$/);

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "System Administration" })).toBeVisible();
    await expect(page.getByText("Email Provider Configuration", { exact: true })).toBeVisible();
  });
});
