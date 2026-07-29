import { defineConfig, devices } from "@playwright/test";

/**
 * Staging E2E — requires PLAYWRIGHT_BASE_URL and E2E_* credentials.
 * Never commit real passwords. Skip gracefully when unset.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "";
const hasCreds = Boolean(
  process.env.E2E_PLATFORM_OWNER_EMAIL &&
    process.env.E2E_PLATFORM_OWNER_PASSWORD &&
    process.env.E2E_STANDARD_USER_EMAIL &&
    process.env.E2E_STANDARD_USER_PASSWORD
);

export default defineConfig({
  testDir: "./e2e/staging",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  timeout: 60_000,
  use: {
    baseURL: baseURL || "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-staging",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // No local webServer — hit the deployed staging URL.
  metadata: { hasCreds, baseURLConfigured: Boolean(baseURL) },
});
