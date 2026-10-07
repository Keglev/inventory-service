/**
 * @file util.firstStringOrEmpty.test.ts
 * @module tests/api/analytics/util.firstStringOrEmpty
 * @description Contract tests for firstStringOrEmpty (api/analytics/util).
 *
 * Contract under test:
 * - Guarantees string field selection respects key order and returns the
 *   first usable value
 * - Guarantees tolerant coercion of numbers to strings for stable
 *   downstream usage
 *
 * Out of scope:
 * - Internationalization/locale formatting of string values
 * - Validation that the chosen keys reflect correct backend contract
 */

import { describe, it, expect } from 'vitest';
import { firstStringOrEmpty } from '@/api/analytics/util';

describe('firstStringOrEmpty', () => {
  it('returns the first matching string', () => {
    const obj = { name: 'test', title: 'other' };

    expect(firstStringOrEmpty(obj, ['name', 'title'])).toBe('test');
  });

  it('coerces numbers to strings', () => {
    const obj = { id: 123 };

    expect(firstStringOrEmpty(obj, ['id'])).toBe('123');
  });

  it('returns empty string when no matching keys exist', () => {
    const obj = { foo: 'bar' };

    expect(firstStringOrEmpty(obj, ['missing', 'nothere'])).toBe('');
  });

  it('tries keys in order', () => {
    const obj = { alt: 'second' };

    expect(firstStringOrEmpty(obj, ['primary', 'alt'])).toBe('second');
  });
});
