/**
 * @file errorHandling.test.ts
 * @module tests/api/inventory/utils/errorHandling
 *
 * @summary
 * Certifies the customer-facing error translation layer for inventory mutations.
 * Exercises errorMessage across structured Axios responses, HTTP fallbacks, and generic exceptions.
 *
 * @enterprise
 * - Guarantees consistent UX copy regardless of backend implementation details
 * - Locks in HTTP status fallbacks so regression deployments cannot leak raw errors
 * - Shields downstream flows from null/undefined surprises by validating final return types
 */

import { describe, expect, it } from 'vitest';

import { errorMessage } from '@/api/inventory/utils/errorHandling';

const makeAxiosError = (payload: unknown): unknown => ({
  response: payload,
});

describe('errorMessage', () => {
  it('extracts message or error fields from structured response data', () => {
    const messageErr = makeAxiosError({
      status: 400,
      data: { message: 'Invalid item name' },
    });
    const errorErr = makeAxiosError({
      status: 500,
      data: { error: 'Server error occurred' },
    });
    const bothErr = makeAxiosError({
      status: 400,
      data: { message: 'Validation failed', error: 'Other error' },
    });

    expect(errorMessage(messageErr)).toBe('Invalid item name');
    expect(errorMessage(errorErr)).toBe('Server error occurred');
    expect(errorMessage(bothErr)).toBe('Validation failed');
  });

  it('provides HTTP status fallbacks when no message present', () => {
    const forbidden = makeAxiosError({ status: 403, data: {} });
    const unauthorized = makeAxiosError({ status: 401, data: {} });
    const notFound = makeAxiosError({ status: 404, data: null });
    const conflict = makeAxiosError({ status: 409, data: {} });
    const badRequest = makeAxiosError({ status: 400, data: {} });

    expect(errorMessage(forbidden)).toBe('Access denied - Admin permission required');
    expect(errorMessage(unauthorized)).toBe('Not authenticated - Please log in');
    expect(errorMessage(notFound)).toBe('Item not found');
    expect(errorMessage(conflict)).toBe('Conflict - Name already exists');
    expect(errorMessage(badRequest)).toBe('Invalid input');
  });

  it('falls back to native Error message or safe default', () => {
    expect(errorMessage(new Error('Network timeout'))).toBe('Network timeout');
    expect(errorMessage('random string')).toBe('Request failed');
    expect(errorMessage(null)).toBe('Request failed');
    expect(errorMessage(undefined)).toBe('Request failed');
    expect(errorMessage({})).toBe('Request failed');
    expect(errorMessage({ message: 'No response' })).toBe('Request failed');
  });
});
