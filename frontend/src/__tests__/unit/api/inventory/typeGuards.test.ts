/**
 * Unit tests for typeGuards.ts
 * Tests type narrowing helper functions
 */
import { describe, it, expect } from 'vitest';
import { isRecord } from '@/api/inventory/utils/typeGuards';

describe('typeGuards', () => {
  describe('isRecord()', () => {
    it('should return true for plain objects', () => {
      expect(isRecord({})).toBe(true);
      expect(isRecord({ key: 'value' })).toBe(true);
      expect(isRecord({ a: 1, b: 2 })).toBe(true);
    });

    it('should return false for null', () => {
      expect(isRecord(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isRecord(undefined)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isRecord('string')).toBe(false);
      expect(isRecord(123)).toBe(false);
      expect(isRecord(true)).toBe(false);
      expect(isRecord(false)).toBe(false);
    });

    it('should return true for arrays (they are objects)', () => {
      expect(isRecord([])).toBe(true);
      expect(isRecord([1, 2, 3])).toBe(true);
    });

    it('should return true for Date objects', () => {
      expect(isRecord(new Date())).toBe(true);
    });

    it('should return true for class instances', () => {
      class TestClass {}
      expect(isRecord(new TestClass())).toBe(true);
    });

    it('should narrow type correctly', () => {
      const value: unknown = { name: 'test' };
      if (isRecord(value)) {
        // TypeScript should now know value is Record<string, unknown>
        const typedValue = value as Record<string, unknown>;
        expect(typeof typedValue.name).toBe('string');
      }
    });
  });
});
