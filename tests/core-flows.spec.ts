import { test, expect } from "@playwright/test";

test.describe("Core User Flows", () => {
  test("should navigate between main pages", async ({ page }) => {
    await page.goto("/");

    // Test navigation to different sections
    const archiveLink = page.locator('a[href*="/archive"]').first();
    if (await archiveLink.isVisible()) {
      await archiveLink.click();
      await expect(page).toHaveURL(/archive/);
    }

    // Navigate back to home
    const homeLink = page.locator('a[href="/"]').first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page).toHaveURL("/");
    }
  });

  test("should handle page errors gracefully", async ({ page }) => {
    // Go to a non-existent page
    const response = await page.goto("/nonexistent-page");

    // Should show 404 or handle gracefully
    expect(response?.status()).toBe(404);
  });

  test("should load page assets", async ({ page }) => {
    await page.goto("/");

    // Check that CSS is loaded (page is styled)
    const body = page.locator("body");
    const backgroundColor = await body.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );

    // Should have some styling applied (not default browser styles)
    expect(backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  });
});
