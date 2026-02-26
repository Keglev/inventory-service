/**
 * @file errorHandling.test.ts
 * @module tests/unit/api/inventory/utils/errorHandling
 * @what_is_under_test errorMessage
 * @responsibility
 * Guarantees a stable, user-facing error string contract for inventory mutation flows,
 * including structured Axios-style responses, HTTP status fallbacks, and safe defaults.
 * @out_of_scope
 * Axios detection fidelity (this suite treats the input as unknown and validates parsing outputs).
 * @out_of_scope
 * UI presentation details (toasts/dialog wording, localization, formatting, and styling).
 */

import { describe, expect, it } from 'vitest';

import { errorMessage } from '@/api/inventory/utils/errorHandling';

const makeAxiosError = (payload: unknown): unknown => ({
  response: payload,
});

describe('errorMessage', () => {
  describe('structured responses', () => {
    it('prefers message and error fields from response data', () => {
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
  });

  describe('HTTP fallbacks', () => {
    it('maps known status codes when no usable message exists', () => {
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
  });

  describe('safe defaults', () => {
    it('returns native Error messages when available', () => {
      expect(errorMessage(new Error('Network timeout'))).toBe('Network timeout');
    });

    it('returns a stable default for non-error inputs', () => {
      expect(errorMessage('random string')).toBe('Request failed');
      expect(errorMessage(null)).toBe('Request failed');
      expect(errorMessage(undefined)).toBe('Request failed');
      expect(errorMessage({})).toBe('Request failed');
      expect(errorMessage({ message: 'No response' })).toBe('Request failed');
    });
  });
});
