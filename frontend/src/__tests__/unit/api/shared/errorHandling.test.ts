/**
 * @file errorHandling.test.ts
 * @module tests/unit/api/shared/errorHandling
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

import { errorMessage, extractApiError } from '../../../../api/shared/errorHandling';

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
      expect(errorMessage(notFound)).toBe('Not found');
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

describe('extractApiError', () => {
  it('extracts token, status, and message from a structured Axios error', () => {
    const err = makeAxiosError({
      status: 409,
      data: { error: 'conflict', message: 'Name already exists' },
    });
    expect(extractApiError(err)).toEqual({
      token: 'conflict',
      status: 409,
      message: 'Name already exists',
      fieldErrors: null,
    });
  });

  it('uses the error token as the message when message is absent', () => {
    const err = makeAxiosError({ status: 404, data: { error: 'not_found' } });
    expect(extractApiError(err)).toEqual({
      token: 'not_found',
      status: 404,
      message: 'not_found',
      fieldErrors: null,
    });
  });

  it('returns the status with a null token when the body has no fields', () => {
    const err = makeAxiosError({ status: 403, data: null });
    expect(extractApiError(err)).toEqual({
      token: null,
      status: 403,
      message: 'Request failed',
      fieldErrors: null,
    });
  });

  it('returns the native Error message with null token and status', () => {
    expect(extractApiError(new Error('Network timeout'))).toEqual({
      token: null,
      status: null,
      message: 'Network timeout',
      fieldErrors: null,
    });
  });

  it('returns stable defaults for non-error inputs', () => {
    expect(extractApiError('nope')).toEqual({ token: null, status: null, message: 'Request failed', fieldErrors: null });
    expect(extractApiError(null)).toEqual({ token: null, status: null, message: 'Request failed', fieldErrors: null });
    expect(extractApiError(undefined)).toEqual({ token: null, status: null, message: 'Request failed', fieldErrors: null });
  });

  it('extracts a fieldErrors map with string values only', () => {
    const err = makeAxiosError({
      status: 400,
      data: {
        error: 'bad_request',
        message: 'sku SKU is mandatory',
        fieldErrors: { sku: 'SKU is mandatory', bogus: 42 },
      },
    });
    expect(extractApiError(err)).toEqual({
      token: 'bad_request',
      status: 400,
      message: 'sku SKU is mandatory',
      fieldErrors: { sku: 'SKU is mandatory' },
    });
  });

  it('returns a null fieldErrors when the map is empty or not an object', () => {
    const emptyMap = makeAxiosError({ status: 400, data: { error: 'bad_request', fieldErrors: {} } });
    expect(extractApiError(emptyMap).fieldErrors).toBeNull();
    const notObject = makeAxiosError({ status: 400, data: { error: 'bad_request', fieldErrors: 'sku' } });
    expect(extractApiError(notObject).fieldErrors).toBeNull();
  });
});
