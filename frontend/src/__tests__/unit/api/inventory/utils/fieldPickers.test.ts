/**
 * @file fieldPickers.test.ts
 * @module tests/api/inventory/utils/fieldPickers
 *
 * @summary
 * Locks the tolerant field extraction helpers that fuel inventory DTO parsing.
 * Validates pickers across string/number coercion and fallback lists used throughout API normalizers.
 *
 * @enterprise
 * - Ensures backend schema drift does not bypass defensive coercion rules
 * - Guarantees consistent null/undefined semantics leveraged across normalization layers
 * - Protects downstream business logic that depends on numeric fallbacks and sanitized text fields
 */

import { describe, expect, it } from 'vitest';

import {
  pickString,
  pickNumber,
  pickNumberFromList,
  pickStringFromList,
} from '@/api/inventory/utils/fieldPickers';

describe('fieldPickers', () => {
  describe('pickString()', () => {
    it('should extract string values', () => {
      expect(pickString({ name: 'test' }, 'name')).toBe('test');
      expect(pickString({ title: 'hello' }, 'title')).toBe('hello');
    });

    it('should return undefined for missing keys', () => {
      expect(pickString({}, 'name')).toBeUndefined();
      expect(pickString({ other: 'value' }, 'name')).toBeUndefined();
    });

    it('should return undefined for non-string values', () => {
      expect(pickString({ count: 42 }, 'count')).toBeUndefined();
      expect(pickString({ flag: true }, 'flag')).toBeUndefined();
      expect(pickString({ obj: {} }, 'obj')).toBeUndefined();
    });
  });

  describe('pickNumber()', () => {
    it('should extract numeric values', () => {
      expect(pickNumber({ qty: 10 }, 'qty')).toBe(10);
      expect(pickNumber({ price: 99.99 }, 'price')).toBe(99.99);
      expect(pickNumber({ count: 0 }, 'count')).toBe(0);
    });

    it('should coerce numeric strings', () => {
      expect(pickNumber({ qty: '42' }, 'qty')).toBe(42);
      expect(pickNumber({ price: '99.99' }, 'price')).toBe(99.99);
      expect(pickNumber({ count: '  123  ' }, 'count')).toBe(123);
    });

    it('should return undefined for NaN and Infinity', () => {
      expect(pickNumber({ val: NaN }, 'val')).toBeUndefined();
      expect(pickNumber({ val: Infinity }, 'val')).toBeUndefined();
      expect(pickNumber({ val: -Infinity }, 'val')).toBeUndefined();
    });

    it('should return undefined for non-numeric strings', () => {
      expect(pickNumber({ val: 'abc' }, 'val')).toBeUndefined();
      expect(pickNumber({ val: '' }, 'val')).toBeUndefined();
      expect(pickNumber({ val: '  ' }, 'val')).toBeUndefined();
    });

    it('should return undefined for missing keys', () => {
      expect(pickNumber({}, 'qty')).toBeUndefined();
    });
  });

  describe('pickNumberFromList()', () => {
    it('should return first number found', () => {
      const obj = { qty: 10, quantity: 20 };
      expect(pickNumberFromList(obj, ['qty', 'quantity'])).toBe(10);
    });

    it('should try alternative keys', () => {
      const obj = { quantity: 42 };
      expect(pickNumberFromList(obj, ['qty', 'quantity', 'count'])).toBe(42);
    });

    it('should return undefined if no keys match', () => {
      expect(pickNumberFromList({}, ['qty', 'quantity'])).toBeUndefined();
      expect(pickNumberFromList({ name: 'test' }, ['qty'])).toBeUndefined();
    });
  });

  describe('pickStringFromList()', () => {
    it('should return first string found', () => {
      const obj = { name: 'Alice', title: 'Bob' };
      expect(pickStringFromList(obj, ['name', 'title'])).toBe('Alice');
    });

    it('should try alternative keys', () => {
      const obj = { itemName: 'Widget' };
      expect(pickStringFromList(obj, ['name', 'itemName', 'title'])).toBe('Widget');
    });

    it('should return undefined if no keys match', () => {
      expect(pickStringFromList({}, ['name', 'title'])).toBeUndefined();
      expect(pickStringFromList({ qty: 10 }, ['name'])).toBeUndefined();
    });
  });
});
