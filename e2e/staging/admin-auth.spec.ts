import { test, expect } from "@playwright/test";

const ownerEmail = process.env.E2E_PLATFORM_OWNER_EMAIL || "";
const ownerPassword = process.env.E2E_PLATFORM_OWNER_PASSWORD || "";
const userEmail = process.env.E2E_STANDARD_USER_EMAIL || "";
const userPassword = process.env.E2E_STANDARD_USER_PASSWORD || "";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "";

const configured = Boolean(baseURL && ownerEmail && ownerPassword && userEmail && userPassword);

test.describe("staging auth + admin", () => {
  test.skip(!configured, "Set PLAYWRIGHT_BASE_URL and E2E_* credentials to run staging E2E");

  test("admin login page loads for anonymous users", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByText(/Owner console login|Secure admin/i).first()).toBeVisible();
  });

  test("platform owner can reach admin overview", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/Email/i).fill(ownerEmail);
    await page.locator('input[type="password"]').fill(ownerPassword);
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page.getByText(/Owner subscription troubleshooting|Overview|Users/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page).toHaveURL(/\/admin/);
  });

  test("standard user is denied admin console", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/Email/i).fill(userEmail);
    await page.locator('input[type="password"]').fill(userPassword);
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page.getByText(/Not a platform admin|Admin access required/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("logout returns to login", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/Email/i).fill(ownerEmail);
    await page.locator('input[type="password"]').fill(ownerPassword);
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page.getByText(/Sign out/i).first()).toBeVisible({ timeout: 30_000 });
    await page.getByText(/Sign out/i).first().click();
    await expect(page.getByText(/Owner console login|Secure admin/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
