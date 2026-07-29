import { test, expect } from "@playwright/test";

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#root")).not.toBeEmpty();
  await expect(page.getByText(/RodStack|Workbench|Builder|Custom/i).first()).toBeVisible({
    timeout: 15_000,
  });
});

test("admin route reaches secure login (no legacy password gate)", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByText(/Owner console login|Secure admin|Loading/i).first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByPlaceholder(/Enter admin password/i)).toHaveCount(0);
  await expect(page.getByText(/rodstack-admin-2026/i)).toHaveCount(0);
});
