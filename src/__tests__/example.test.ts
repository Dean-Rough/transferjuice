import { validateEmail } from "@/lib/validations/utils";

describe("Example test using jest-extended matchers", () => {
  it("should validate email using jest-extended matchers", () => {
    const validEmail = "test@example.com";
    const invalidEmail = "invalid-email";
    const emptyEmail = "";

    // Using standard Jest matchers first
    expect(validateEmail(validEmail)).toBe(true);
    expect(validateEmail(invalidEmail)).toBe(false);
    expect(validateEmail(emptyEmail)).toBe(false);

    // Testing with arrays
    const emails = [validEmail, "another@test.com", "user@domain.org"];
    expect(emails).toIncludeAllMembers([
      validEmail,
      "another@test.com",
      "user@domain.org",
    ]);
    expect(emails).toHaveLength(3);

    // Testing objects
    const userProfile = {
      email: validEmail,
      name: "Test User",
      preferences: {
        newsletter: true,
        notifications: false,
      },
    };

    expect(userProfile).toContainKey("email");
    expect(userProfile).toContainValue(validEmail);
    expect(userProfile.preferences).toSatisfy(
      (prefs: any) =>
        typeof prefs === "object" &&
        "newsletter" in prefs &&
        "notifications" in prefs,
    );

    // Testing strings
    expect(validEmail).toStartWith("test@");
    expect(validEmail).toEndWith(".com");
    expect(validEmail).toInclude("@example");

    // Testing numbers with jest-extended
    const score = 85.5;
    expect(score).toBePositive();
    expect(score).toBeGreaterThan(80);
    expect(score).toBeWithin(80, 90);

    // Testing dates
    const now = new Date();
    const future = new Date(Date.now() + 86400000); // +1 day
    expect(future).toBeAfter(now);
    expect(now).toBeBefore(future);
  });

  it("should demonstrate promise matchers", async () => {
    const successPromise = Promise.resolve("success");

    // Standard Jest promise matchers work fine
    await expect(successPromise).resolves.toBe("success");

    // Test rejecting promise
    const errorPromise = Promise.reject(new Error("test error"));
    await expect(errorPromise).rejects.toThrow("test error");
  });

  it("should demonstrate function matchers", () => {
    const mockFn = jest.fn();
    const throwingFn = () => {
      throw new Error("Test error");
    };

    mockFn("arg1", "arg2");
    mockFn("arg3");

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
    expect(mockFn).toHaveBeenLastCalledWith("arg3");
    expect(throwingFn).toThrow("Test error");
  });
});
