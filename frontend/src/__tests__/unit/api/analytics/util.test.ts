/**
 * @file util.test.ts
 * @module api/analytics/util.test
 * 
 * Unit tests for analytics utility functions.
 * Tests asNumber, isRecord, isArrayOfRecords, pickString, pickNumber,
 * normalizeItemsList, clientFilter, and paramClean.
 */

import { describe, it, expect } from 'vitest';
import {
  asNumber,
  isRecord,
  isArrayOfRecords,
  pickString,
  pickNumber,
  normalizeItemsList,
  clientFilter,
  paramClean,
} from '@/api/analytics/util';

describe('asNumber', () => {
  it('should return number as-is if finite', () => {
    expect(asNumber(42)).toBe(42);
    expect(asNumber(3.14)).toBe(3.14);
    expect(asNumber(0)).toBe(0);
    expect(asNumber(-10)).toBe(-10);
  });

  it('should convert numeric strings to numbers', () => {
    expect(asNumber('42')).toBe(42);
    expect(asNumber('3.14')).toBe(3.14);
    expect(asNumber('-10')).toBe(-10);
  });

  it('should return 0 for non-finite numbers', () => {
    expect(asNumber(NaN)).toBe(0);
    expect(asNumber(Infinity)).toBe(0);
    expect(asNumber(-Infinity)).toBe(0);
  });

  it('should return 0 for non-numeric strings', () => {
    expect(asNumber('foo')).toBe(0);
    expect(asNumber('abc123')).toBe(0);
    expect(asNumber('')).toBe(0);
    expect(asNumber('   ')).toBe(0);
  });

  it('should return 0 for null/undefined/objects/arrays', () => {
    expect(asNumber(null)).toBe(0);
    expect(asNumber(undefined)).toBe(0);
    expect(asNumber({})).toBe(0);
    expect(asNumber([])).toBe(0);
  });
});

describe('isRecord', () => {
  it('should return true for plain objects', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it('should return false for null', () => {
    expect(isRecord(null)).toBe(false);
  });

  it('should return false for arrays', () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord([1, 2, 3])).toBe(false);
  });

  it('should return false for primitives', () => {
    expect(isRecord('string')).toBe(false);
    expect(isRecord(123)).toBe(false);
    expect(isRecord(true)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });
});

describe('isArrayOfRecords', () => {
  it('should return true for array of objects', () => {
    expect(isArrayOfRecords([{}, { a: 1 }])).toBe(true);
  });

  it('should return true for empty array', () => {
    expect(isArrayOfRecords([])).toBe(true);
  });

  it('should return false for non-arrays', () => {
    expect(isArrayOfRecords({})).toBe(false);
    expect(isArrayOfRecords('array')).toBe(false);
  });

  it('should return false if any element is not a record', () => {
    expect(isArrayOfRecords([{}, 'string', {}])).toBe(false);
    expect(isArrayOfRecords([1, 2, 3])).toBe(false);
  });
});

describe('pickString', () => {
  it('should return first matching string', () => {
    const obj = { name: 'test', title: 'other' };
    expect(pickString(obj, ['name', 'title'])).toBe('test');
  });

  it('should convert number to string', () => {
    const obj = { id: 123 };
    expect(pickString(obj, ['id'])).toBe('123');
  });

  it('should return empty string if no match', () => {
    const obj = { foo: 'bar' };
    expect(pickString(obj, ['missing', 'nothere'])).toBe('');
  });

  it('should try multiple keys in order', () => {
    const obj = { alt: 'second' };
    expect(pickString(obj, ['primary', 'alt'])).toBe('second');
  });
});

describe('pickNumber', () => {
  it('should return first matching number', () => {
    const obj = { count: 42, total: 100 };
    expect(pickNumber(obj, ['count', 'total'])).toBe(42);
  });

  it('should coerce string to number', () => {
    const obj = { value: '3.14' };
    expect(pickNumber(obj, ['value'])).toBe(3.14);
  });

  it('should return 0 if no match', () => {
    const obj = { foo: 'bar' };
    expect(pickNumber(obj, ['missing'])).toBe(0);
  });

  it('should return 0 for non-numeric values', () => {
    const obj = { value: 'not-a-number' };
    expect(pickNumber(obj, ['value'])).toBe(0);
  });
});

describe('normalizeItemsList', () => {
  it('should normalize items with id and name', () => {
    const data = [
      { id: '1', name: 'Item A' },
      { id: '2', name: 'Item B' },
    ];
    const result = normalizeItemsList(data);

    expect(result).toEqual([
      { id: '1', name: 'Item A', supplierId: undefined },
      { id: '2', name: 'Item B', supplierId: undefined },
    ]);
  });

  it('should use itemId and itemName as fallbacks', () => {
    const data = [{ itemId: '10', itemName: 'Fallback Item' }];
    const result = normalizeItemsList(data);

    expect(result).toEqual([{ id: '10', name: 'Fallback Item', supplierId: undefined }]);
  });

  it('should include supplierId if present', () => {
    const data = [{ id: '5', name: 'With Supplier', supplierId: 'S100' }];
    const result = normalizeItemsList(data);

    expect(result).toEqual([{ id: '5', name: 'With Supplier', supplierId: 'S100' }]);
  });

  it('should filter out entries without id or name', () => {
    const data = [
      { id: '1', name: 'Valid' },
      { id: '', name: 'No ID' },
      { id: '2', name: '' },
      { name: 'No ID field' },
    ];
    const result = normalizeItemsList(data);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should return empty array for non-array input', () => {
    expect(normalizeItemsList(null)).toEqual([]);
    expect(normalizeItemsList(undefined)).toEqual([]);
    expect(normalizeItemsList('string')).toEqual([]);
    expect(normalizeItemsList({})).toEqual([]);
  });
});

describe('clientFilter', () => {
  const items = [
    { id: '1', name: 'Apple' },
    { id: '2', name: 'Banana' },
    { id: '3', name: 'Cherry' },
  ];

  it('should filter items by search query case-insensitive', () => {
    const result = clientFilter(items, 'ban', 10);
    expect(result).toEqual([{ id: '2', name: 'Banana' }]);
  });

  it('should return first N items when query is empty', () => {
    const result = clientFilter(items, '', 2);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Apple');
  });

  it('should respect limit parameter', () => {
    const many = Array.from({ length: 100 }, (_, i) => ({ id: String(i), name: `Item ${i}` }));
    const result = clientFilter(many, '', 5);
    expect(result).toHaveLength(5);
  });
});

describe('paramClean', () => {
  it('should use provided from and to dates', () => {
    const params = { from: '2023-01-01', to: '2023-12-31' };
    const result = paramClean(params);

    expect(result.start).toBe('2023-01-01');
    expect(result.end).toBe('2023-12-31');
  });

  it('should include supplierId if provided', () => {
    const params = { supplierId: 'S123' };
    const result = paramClean(params);

    expect(result.supplierId).toBe('S123');
  });

  it('should default to 180 days ago if no dates provided', () => {
    const result = paramClean();

    expect(result.start).toBeTruthy();
    expect(result.end).toBeTruthy();
    expect(result.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
