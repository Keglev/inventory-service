/**
 * @file util.number.test.ts
 * @module tests/unit/api/analytics/util.number
 * @what_is_under_test asNumber and pickNumber (api/analytics/util)
 * @responsibility
 * - Guarantees numeric normalization is tolerant (invalid inputs become 0)
 * - Guarantees numeric field selection respects key order and supports string-to-number coercion
 * @out_of_scope
 * - Locale-specific number parsing, currency formatting, and rounding policy
 * - Validation of upstream payload contracts that supply these values
 */

import { describe, it, expect } from 'vitest';
import { asNumber, pickNumber } from '@/api/analytics/util';

describe('asNumber', () => {
  it('returns finite numbers as-is', () => {
    expect(asNumber(42)).toBe(42);
    expect(asNumber(3.14)).toBe(3.14);
    expect(asNumber(0)).toBe(0);
    expect(asNumber(-10)).toBe(-10);
  });

  it('coerces numeric strings to numbers', () => {
    expect(asNumber('42')).toBe(42);
    expect(asNumber('3.14')).toBe(3.14);
    expect(asNumber('-10')).toBe(-10);
  });

  it('returns 0 for non-finite numbers', () => {
    expect(asNumber(NaN)).toBe(0);
    expect(asNumber(Infinity)).toBe(0);
    expect(asNumber(-Infinity)).toBe(0);
  });

  it('returns 0 for non-numeric strings', () => {
    expect(asNumber('foo')).toBe(0);
    expect(asNumber('abc123')).toBe(0);
    expect(asNumber('')).toBe(0);
    expect(asNumber('   ')).toBe(0);
  });

  it('returns 0 for null/undefined/objects/arrays', () => {
    expect(asNumber(null)).toBe(0);
    expect(asNumber(undefined)).toBe(0);
    expect(asNumber({})).toBe(0);
    expect(asNumber([])).toBe(0);
  });
});

describe('pickNumber', () => {
  it('returns the first matching number by key order', () => {
    const obj = { count: 42, total: 100 };

    expect(pickNumber(obj, ['count', 'total'])).toBe(42);
  });

  it('coerces numeric strings to numbers', () => {
    const obj = { value: '3.14' };

    expect(pickNumber(obj, ['value'])).toBe(3.14);
  });

  it('returns 0 when no matching keys exist', () => {
    const obj = { foo: 'bar' };

    expect(pickNumber(obj, ['missing'])).toBe(0);
  });

  it('returns 0 for non-numeric values', () => {
    const obj = { value: 'not-a-number' };

    expect(pickNumber(obj, ['value'])).toBe(0);
  });
});
