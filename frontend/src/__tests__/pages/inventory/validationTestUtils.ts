/**
 * @file validationTestUtils.ts
 * @module __tests__/components/pages/inventory/validationTestUtils
 * @description Small assertion helpers for Zod-style `safeParse` tests.
 *
 * Goals:
 * - Keep schema tests readable and consistent.
 * - Avoid re-implementing the same success/error plumbing in every file.
 */

import { expect } from 'vitest';

type SafeParseSuccess<T> = { success: true; data: T };
type SafeParseFailure = {
  success: false;
  error: { issues: Array<{ message: string }> };
};

export type SafeParseSchema<T> = {
  safeParse: (data: unknown) => SafeParseSuccess<T> | SafeParseFailure;
};

export function expectValid<T>(
  schema: SafeParseSchema<T>,
  data: unknown,
  expectedData?: T,
) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(true);

  if (result.success) {
    if (expectedData !== undefined) {
      expect(result.data).toEqual(expectedData);
    } else {
      expect(result.data).toEqual(data);
    }
  }
}

export function expectInvalidMessage<T>(
  schema: SafeParseSchema<T>,
  data: unknown,
  message: string,
) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);

  if (!result.success) {
    expect(result.error.issues[0]?.message).toBe(message);
  }
}
