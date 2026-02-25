/**
 * @file util.recordGuards.test.ts
 * @module tests/unit/api/analytics/util.recordGuards
 * @what_is_under_test isRecord and isArrayOfRecords (api/analytics/util)
 * @responsibility
 * - Guarantees runtime guards correctly distinguish record-like objects from primitives/arrays
 * - Guarantees array guard only succeeds when every element is a record
 * @out_of_scope
 * - Deep schema validation of record contents
 * - Prototype edge cases beyond typical JSON-like payloads
 */

import { describe, it, expect } from 'vitest';
import { isRecord, isArrayOfRecords } from '@/api/analytics/util';

describe('isRecord', () => {
  it('returns true for plain objects', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isRecord(null)).toBe(false);
  });

  it('returns false for arrays', () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord([1, 2, 3])).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isRecord('string')).toBe(false);
    expect(isRecord(123)).toBe(false);
    expect(isRecord(true)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });
});

describe('isArrayOfRecords', () => {
  it('returns true for an array of objects', () => {
    expect(isArrayOfRecords([{}, { a: 1 }])).toBe(true);
  });

  it('returns true for an empty array', () => {
    expect(isArrayOfRecords([])).toBe(true);
  });

  it('returns false for non-arrays', () => {
    expect(isArrayOfRecords({})).toBe(false);
    expect(isArrayOfRecords('array')).toBe(false);
  });

  it('returns false if any element is not a record', () => {
    expect(isArrayOfRecords([{}, 'string', {}])).toBe(false);
    expect(isArrayOfRecords([1, 2, 3])).toBe(false);
  });
});
