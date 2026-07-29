import { test, expect } from "@playwright/test";

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#root")).not.toBeEmpty();
  await expect(page.getByText(/RodStack|Workbench|Builder|Custom/i).first()).toBeVisible({
    timeout: 15_000,
  });
});

test("admin route shows disabled notice", async ({ page }) => {
  await page.goto("/#admin");
  await expect(page.getByText(/Access disabled/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByPlaceholder(/Enter admin password/i)).toHaveCount(0);
});
