import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load homepage successfully", async ({ page }) => {
    await page.goto("/");

    // Check basic page structure
    await expect(page).toHaveTitle(/Transfer Juice/);

    // Check header is present
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Check main content area
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("should display navigation elements", async ({ page }) => {
    await page.goto("/");

    // Check for navigation links
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Page should still load and be usable
    await expect(page).toHaveTitle(/Transfer Juice/);

    // Main content should be visible
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });
});
