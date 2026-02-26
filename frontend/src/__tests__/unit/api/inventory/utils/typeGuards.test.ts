/**
 * @file typeGuards.test.ts
 * @module tests/unit/api/inventory/utils/typeGuards
 * @what_is_under_test isRecord
 * @responsibility
 * Guarantees the type guard’s boundary contract used by inventory parsing utilities:
 * it must accept non-null objects (including arrays/instances) and reject null/undefined/primitives.
 * @out_of_scope
 * Deep shape validation (this guard only answers “is it an object-like record?”).
 * @out_of_scope
 * TypeScript compiler behavior (these are runtime assertions; TS narrowing is incidental).
 */

import { describe, expect, it } from 'vitest';

import { isRecord } from '@/api/inventory/utils/typeGuards';

describe('typeGuards', () => {
  describe('isRecord()', () => {
    describe('accepts object-like values', () => {
      it('returns true for plain objects', () => {
        expect(isRecord({})).toBe(true);
        expect(isRecord({ key: 'value' })).toBe(true);
        expect(isRecord({ a: 1, b: 2 })).toBe(true);
      });

      it('returns true for arrays and instances (they are objects at runtime)', () => {
        class TestClass {}
        expect(isRecord([])).toBe(true);
        expect(isRecord([1, 2, 3])).toBe(true);
        expect(isRecord(new Date())).toBe(true);
        expect(isRecord(new TestClass())).toBe(true);
      });
    });

    describe('rejects non-objects', () => {
      it('returns false for null and undefined', () => {
        expect(isRecord(null)).toBe(false);
        expect(isRecord(undefined)).toBe(false);
      });

      it('returns false for primitives', () => {
        expect(isRecord('string')).toBe(false);
        expect(isRecord(123)).toBe(false);
        expect(isRecord(true)).toBe(false);
        expect(isRecord(false)).toBe(false);
      });
    });

    it('supports safe property access after narrowing', () => {
      const value: unknown = { name: 'test' };

      if (isRecord(value)) {
        expect(typeof value.name).toBe('string');
      }
    });
  });
});
