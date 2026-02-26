/**
 * @file fieldPickers.test.ts
 * @module tests/unit/api/inventory/utils/fieldPickers
 * @what_is_under_test fieldPickers
 * @responsibility
 * Guarantees defensive field extraction and coercion contracts used by inventory DTO normalizers,
 * including undefined-on-mismatch behavior and deterministic “first match wins” list semantics.
 * @out_of_scope
 * End-to-end DTO normalization (covered by hook/service tests that compose these helpers).
 * @out_of_scope
 * Performance characteristics (these tests validate correctness, not runtime cost).
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
    it('returns a string when the field is a string', () => {
      expect(pickString({ name: 'test' }, 'name')).toBe('test');
      expect(pickString({ title: 'hello' }, 'title')).toBe('hello');
    });

    it('returns undefined when the field is missing', () => {
      expect(pickString({}, 'name')).toBeUndefined();
      expect(pickString({ other: 'value' }, 'name')).toBeUndefined();
    });

    it('returns undefined when the field is not a string', () => {
      expect(pickString({ count: 42 }, 'count')).toBeUndefined();
      expect(pickString({ flag: true }, 'flag')).toBeUndefined();
      expect(pickString({ obj: {} }, 'obj')).toBeUndefined();
    });
  });

  describe('pickNumber()', () => {
    it('returns numbers without coercion when the field is numeric', () => {
      expect(pickNumber({ qty: 10 }, 'qty')).toBe(10);
      expect(pickNumber({ price: 99.99 }, 'price')).toBe(99.99);
      expect(pickNumber({ count: 0 }, 'count')).toBe(0);
    });

    it('coerces numeric strings (including surrounding whitespace)', () => {
      expect(pickNumber({ qty: '42' }, 'qty')).toBe(42);
      expect(pickNumber({ price: '99.99' }, 'price')).toBe(99.99);
      expect(pickNumber({ count: '  123  ' }, 'count')).toBe(123);
    });

    it('returns undefined for NaN and Infinity', () => {
      expect(pickNumber({ val: NaN }, 'val')).toBeUndefined();
      expect(pickNumber({ val: Infinity }, 'val')).toBeUndefined();
      expect(pickNumber({ val: -Infinity }, 'val')).toBeUndefined();
    });

    it('returns undefined for non-numeric strings', () => {
      expect(pickNumber({ val: 'abc' }, 'val')).toBeUndefined();
      expect(pickNumber({ val: '' }, 'val')).toBeUndefined();
      expect(pickNumber({ val: '  ' }, 'val')).toBeUndefined();
    });

    it('returns undefined when the field is missing', () => {
      expect(pickNumber({}, 'qty')).toBeUndefined();
    });
  });

  describe('pickNumberFromList()', () => {
    it('returns the first valid number match in key order', () => {
      const obj = { qty: 10, quantity: 20 };
      expect(pickNumberFromList(obj, ['qty', 'quantity'])).toBe(10);
    });

    it('tries subsequent keys until a match is found', () => {
      const obj = { quantity: 42 };
      expect(pickNumberFromList(obj, ['qty', 'quantity', 'count'])).toBe(42);
    });

    it('returns undefined when no listed keys resolve to a number', () => {
      expect(pickNumberFromList({}, ['qty', 'quantity'])).toBeUndefined();
      expect(pickNumberFromList({ name: 'test' }, ['qty'])).toBeUndefined();
    });
  });

  describe('pickStringFromList()', () => {
    it('returns the first valid string match in key order', () => {
      const obj = { name: 'Alice', title: 'Bob' };
      expect(pickStringFromList(obj, ['name', 'title'])).toBe('Alice');
    });

    it('tries subsequent keys until a match is found', () => {
      const obj = { itemName: 'Widget' };
      expect(pickStringFromList(obj, ['name', 'itemName', 'title'])).toBe('Widget');
    });

    it('returns undefined when no listed keys resolve to a string', () => {
      expect(pickStringFromList({}, ['name', 'title'])).toBeUndefined();
      expect(pickStringFromList({ qty: 10 }, ['name'])).toBeUndefined();
    });
  });
});
