import { z } from "zod";

/**
 * Validation Utilities
 * Common utilities for working with Zod schemas across the application
 */

/**
 * Simple email validation function for testing
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Creates a safe validator function that returns validation results
 */
export function createValidator<T extends z.ZodTypeAny>(schema: T) {
  return (data: unknown): z.SafeParseReturnType<unknown, z.infer<T>> => {
    return schema.safeParse(data);
  };
}

/**
 * Creates a validator that throws on validation failure
 */
export function createStrictValidator<T extends z.ZodTypeAny>(schema: T) {
  return (data: unknown): z.infer<T> => {
    return schema.parse(data);
  };
}

/**
 * Formats Zod validation errors into user-friendly messages
 */
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join(".");
    const pathStr = path ? `${path}: ` : "";
    return `${pathStr}${issue.message}`;
  });
}

/**
 * Creates a formatted error message from validation result
 */
export function getValidationErrorMessage(
  result: z.SafeParseReturnType<unknown, unknown>,
): string | null {
  if (result.success) {
    return null;
  }

  const errors = formatValidationErrors(result.error);
  return errors.length === 1 ? errors[0] : errors.join("; ");
}

/**
 * Validates data and returns either the parsed result or formatted error
 */
export function validateOrError<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessage = getValidationErrorMessage(result);
  return { success: false, error: errorMessage || "Validation failed" };
}

/**
 * Middleware helper for validating API request bodies
 */
export function validateRequestBody<T extends z.ZodTypeAny>(schema: T) {
  return (data: unknown): z.infer<T> => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = formatValidationErrors(error);
        throw new ValidationError("Request validation failed", formattedErrors);
      }
      throw error;
    }
  };
}

/**
 * Middleware helper for validating query parameters
 */
export function validateQueryParams<T extends z.ZodTypeAny>(schema: T) {
  return (
    params: Record<string, string | string[] | undefined>,
  ): z.infer<T> => {
    try {
      return schema.parse(params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = formatValidationErrors(error);
        throw new ValidationError(
          "Query parameter validation failed",
          formattedErrors,
        );
      }
      throw error;
    }
  };
}

/**
 * Custom validation error class (Terry-approved)
 */
export class ValidationError extends Error {
  public readonly code = "VALIDATION_ERROR";
  public readonly statusCode = 400;
  public readonly errors: string[];

  constructor(message: string, errors: string[] = []) {
    // Add some Terry flair to error messages
    const terryMessage = message.includes("validation")
      ? `${message} (The Terry suggests checking your input, because something has gone magnificently wrong)`
      : message;

    super(terryMessage);
    this.name = "ValidationError";
    this.errors = errors.map((error) =>
      error.includes("required")
        ? `${error} - apparently this field is more important than we thought`
        : error.includes("invalid")
          ? `${error} - which is the digital equivalent of bringing a spoon to a knife fight`
          : error,
    );
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      errors: this.errors,
    };
  }
}

/**
 * Type guard to check if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Transforms raw form data into properly typed objects
 */
export function transformFormData(formData: FormData): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (key.endsWith("[]")) {
      // Handle array fields
      const arrayKey = key.slice(0, -2);
      if (!data[arrayKey]) {
        data[arrayKey] = [];
      }
      (data[arrayKey] as unknown[]).push(value);
    } else if (data[key]) {
      // Convert single value to array if key already exists
      if (!Array.isArray(data[key])) {
        data[key] = [data[key]];
      }
      (data[key] as unknown[]).push(value);
    } else {
      data[key] = value;
    }
  }

  return data;
}

/**
 * Transforms query string parameters to proper types
 */
export function transformQueryParams(
  params: URLSearchParams,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const [key, value] of params.entries()) {
    if (data[key]) {
      // Convert to array if key already exists
      if (!Array.isArray(data[key])) {
        data[key] = [data[key]];
      }
      (data[key] as unknown[]).push(value);
    } else {
      data[key] = value;
    }
  }

  return data;
}

/**
 * Recursively removes undefined values from objects
 */
export function removeUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeUndefined) as T;
  }

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = removeUndefined(value);
    }
  }

  return cleaned as T;
}

/**
 * Validates environment variables at startup
 */
export function validateEnvironmentVariables<T extends z.ZodTypeAny>(
  schema: T,
  env: Record<string, string | undefined> = process.env,
): z.infer<T> {
  const result = schema.safeParse(env);

  if (!result.success) {
    console.error("❌ Environment validation failed:");
    console.error("");

    const errors = formatValidationErrors(result.error);
    errors.forEach((error) => console.error(`  ${error}`));

    console.error("");
    console.error("Please check your environment variables and try again.");

    process.exit(1);
  }

  return result.data;
}

/**
 * Creates a schema for API pagination
 */
export function createPaginationSchema(maxLimit = 100) {
  return z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(maxLimit).default(10),
    offset: z.coerce.number().min(0).optional(),
  });
}

/**
 * Creates a schema for API sorting
 */
export function createSortSchema<T extends readonly string[]>(fields: T) {
  return z.object({
    field: z.enum(fields as any),
    order: z.enum(["asc", "desc"]).default("desc"),
  });
}

/**
 * Creates a schema for date range queries
 */
export function createDateRangeSchema() {
  return z
    .object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    })
    .refine(
      (data) => {
        if (data.from && data.to) {
          return new Date(data.from) <= new Date(data.to);
        }
        return true;
      },
      {
        message: "End date must be after start date",
        path: ["to"],
      },
    );
}

/**
 * Type-safe object pick utility with validation
 */
export function validateAndPick<
  T extends Record<string, unknown>,
  K extends keyof T,
>(schema: z.ZodSchema<T>, obj: unknown, keys: K[]): Pick<T, K> {
  const validated = schema.parse(obj);
  const picked: Partial<Pick<T, K>> = {};

  for (const key of keys) {
    if (key in validated) {
      picked[key] = validated[key];
    }
  }

  return picked as Pick<T, K>;
}

/**
 * Type-safe object omit utility with validation
 */
export function validateAndOmit<
  T extends Record<string, unknown>,
  K extends keyof T,
>(schema: z.ZodSchema<T>, obj: unknown, keys: K[]): Omit<T, K> {
  const validated = schema.parse(obj);
  const result = { ...validated };

  for (const key of keys) {
    delete result[key];
  }

  return result as Omit<T, K>;
}

/**
 * Schema for validating file uploads
 */
export const FileUploadSchema = z.object({
  name: z.string().min(1).max(255),
  size: z
    .number()
    .min(1)
    .max(10 * 1024 * 1024), // 10MB max
  type: z.string().min(1),
  lastModified: z.number().min(0),
});

/**
 * Schema for validating image uploads specifically
 */
export const ImageUploadSchema = FileUploadSchema.extend({
  type: z
    .string()
    .regex(/^image\/(jpeg|jpg|png|gif|webp)$/i, "Must be a valid image format"),
  size: z
    .number()
    .min(1)
    .max(5 * 1024 * 1024), // 5MB max for images
});

/**
 * Schema for validating URLs with specific protocols
 */
export function createUrlSchema(protocols: string[] = ["http", "https"]) {
  return z
    .string()
    .url()
    .refine(
      (url) => protocols.some((protocol) => url.startsWith(`${protocol}://`)),
      {
        message: `URL must use one of these protocols: ${protocols.join(", ")}`,
      },
    );
}

/**
 * Utility to create enum schemas from arrays
 */
export function createEnumSchema<T extends readonly string[]>(values: T) {
  return z.enum(values as unknown as [string, ...string[]]);
}

/**
 * Advanced email validation schema
 */
export const AdvancedEmailSchema = z
  .string()
  .email()
  .min(5)
  .max(254)
  .transform((email) => email.toLowerCase().trim())
  .refine(
    (email) => {
      // Additional validation rules
      const localPart = email.split("@")[0];
      const domainPart = email.split("@")[1];

      // Check local part isn't too long
      if (localPart.length > 64) return false;

      // Check for valid domain structure
      if (!domainPart.includes(".")) return false;

      // Check domain parts
      const domainParts = domainPart.split(".");
      for (const part of domainParts) {
        if (part.length === 0 || part.length > 63) return false;
      }

      return true;
    },
    { message: "Invalid email format" },
  );

// Export commonly used schema combinations
export const CommonSchemas = {
  id: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  url: createUrlSchema(),
  email: AdvancedEmailSchema,
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
  timestamp: z.string().datetime(),
  uuid: z.string().uuid(),
  pagination: createPaginationSchema(),
  dateRange: createDateRangeSchema(),
};
