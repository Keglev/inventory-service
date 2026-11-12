/**
 * @file util.firstStringOrEmpty.test.ts
 * @module __tests__/api/analytics/util.firstStringOrEmpty
 * @description Contract tests for firstStringOrEmpty (api/analytics/util).
 *
 * Contract under test:
 * - Guarantees the key's string value is returned, '' when the key is
 *   missing or holds neither a string nor a number
 * - Guarantees tolerant coercion of numbers to strings for stable
 *   downstream usage
 *
 * Out of scope:
 * - Internationalization/locale formatting of string values
 * - Validation that the chosen keys reflect correct backend contract
 *
 * Sibling specs: util.number.test.ts, util.paramClean.test.ts, util.recordGuards.test.ts.
 */

import { describe, it, expect } from 'vitest';
import { firstStringOrEmpty } from '@/api/analytics/util';

describe('firstStringOrEmpty', () => {
  it('returns the string value of the key', () => {
    const obj = { name: 'test', title: 'other' };

    expect(firstStringOrEmpty(obj, 'name')).toBe('test');
  });

  it('coerces numbers to strings', () => {
    const obj = { id: 123 };

    expect(firstStringOrEmpty(obj, 'id')).toBe('123');
  });

  it('returns empty string when the key is missing', () => {
    const obj = { foo: 'bar' };

    expect(firstStringOrEmpty(obj, 'missing')).toBe('');
  });

  it('returns empty string when the value is neither a string nor a number', () => {
    const obj = { flag: true };

    expect(firstStringOrEmpty(obj, 'flag')).toBe('');
  });
});
