import { test, expect } from "@playwright/test";

test.describe("API Routes", () => {
  test("should return health check", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("status");
  });

  test("should handle feed API", async ({ request }) => {
    const response = await request.get("/api/feed");

    // Should return some response (might be empty data, but shouldn't error)
    expect(response.status()).toBeLessThan(500);
  });

  test("should handle missing routes gracefully", async ({ request }) => {
    const response = await request.get("/api/nonexistent");

    expect(response.status()).toBe(404);
  });
});
