/**
 * @file typeGuards.test.ts
 * @module tests/unit/api/shared/typeGuards
 * @description Contract tests for isRecord.
 *
 * Contract under test:
 * - Guarantees the type guard's boundary contract used by inventory
 *   parsing utilities: it must accept non-null objects (including
 *   arrays/instances) and reject null/undefined/primitives.
 *
 * Out of scope:
 * - TypeScript compiler behavior (these are runtime assertions; TS
 *   narrowing is incidental).
 */

import { describe, expect, it } from 'vitest';

import { isRecord } from '../../../../api/shared/typeGuards';

describe('typeGuards', () => {
  describe('isRecord()', () => {
    describe('accepts object-like values', () => {
      it('returns true for plain objects', () => {
        expect(isRecord({})).toBe(true);
        expect(isRecord({ key: 'value' })).toBe(true);
        expect(isRecord({ a: 1, b: 2 })).toBe(true);
      });

      // Tightened contract: isRecord now excludes arrays
      // to match the analytics-side semantics. Inventory call sites already guarded
      // arrays separately, so no production behavior changes.
      it('returns false for arrays', () => {
        expect(isRecord([])).toBe(false);
        expect(isRecord([1, 2, 3])).toBe(false);
      });

      it('returns true for class and built-in instances (they are non-array objects)', () => {
        class TestClass {}
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
