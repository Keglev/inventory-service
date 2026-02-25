/**
 * @file util.pickString.test.ts
 * @module tests/unit/api/analytics/util.pickString
 * @what_is_under_test pickString (api/analytics/util)
 * @responsibility
 * - Guarantees string field selection respects key order and returns the first usable value
 * - Guarantees tolerant coercion of numbers to strings for stable downstream usage
 * @out_of_scope
 * - Internationalization/locale formatting of string values
 * - Validation that the chosen keys reflect correct backend contract
 */

import { describe, it, expect } from 'vitest';
import { pickString } from '@/api/analytics/util';

describe('pickString', () => {
  it('returns the first matching string', () => {
    const obj = { name: 'test', title: 'other' };

    expect(pickString(obj, ['name', 'title'])).toBe('test');
  });

  it('coerces numbers to strings', () => {
    const obj = { id: 123 };

    expect(pickString(obj, ['id'])).toBe('123');
  });

  it('returns empty string when no matching keys exist', () => {
    const obj = { foo: 'bar' };

    expect(pickString(obj, ['missing', 'nothere'])).toBe('');
  });

  it('tries keys in order', () => {
    const obj = { alt: 'second' };

    expect(pickString(obj, ['primary', 'alt'])).toBe('second');
  });
});
