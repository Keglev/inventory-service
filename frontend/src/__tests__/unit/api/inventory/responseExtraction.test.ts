/**
 * @file responseExtraction.test.ts
 * @module tests/unit/api/inventory/responseExtraction
 * @description Contract tests for resDataOrEmpty / extractArray / extractPageTotal.
 *
 * Contract under test:
 * - Guarantees safe response-shape extraction contracts used by
 *   inventory fetchers: helpers must tolerate unknown inputs, never
 *   throw, and return deterministic empty fallbacks when data is absent.
 *
 * Out of scope:
 * - Downstream normalization behavior (handled by row/DTO normalizer
 *   unit tests).
 */

import { describe, expect, it } from 'vitest';

import { extractArray, extractPageTotal, resDataOrEmpty } from '../../../../api/shared/responseExtraction';

describe('resDataOrEmpty', () => {
  it('returns data property from Axios-style responses', () => {
    const resp = { data: { items: [] } };

    expect(resDataOrEmpty(resp)).toEqual({ items: [] });
  });

  it('returns empty object when response missing data', () => {
    expect(resDataOrEmpty({})).toEqual({});
    expect(resDataOrEmpty(null)).toEqual({});
  });
});

describe('extractArray', () => {
  it('pulls array from prioritized keys', () => {
    const source = { items: [1, 2, 3], content: ['x'] };

    expect(extractArray(source, ['content', 'items'])).toEqual(['x']);
    expect(extractArray(source, ['items', 'content'])).toEqual([1, 2, 3]);
  });

  it('returns empty array for non-array values or non-records', () => {
    expect(extractArray({ items: 'not array' }, ['items'])).toEqual([]);
    expect(extractArray(null, ['items'])).toEqual([]);
  });
});

describe('extractPageTotal', () => {
  it('reads the total nested under page (Spring Data PagedModel)', () => {
    expect(extractPageTotal({ content: [], page: { size: 10, number: 2, totalElements: 21, totalPages: 3 } })).toBe(21);
  });

  it('reads the top-level total (serialised PageImpl)', () => {
    expect(extractPageTotal({ content: [], totalElements: 21, number: 2 })).toBe(21);
  });

  it('prefers the nested total and falls back when page carries none', () => {
    expect(extractPageTotal({ page: { totalElements: 5 }, totalElements: 9 })).toBe(5);
    expect(extractPageTotal({ page: { size: 10 }, totalElements: 9 })).toBe(9);
    expect(extractPageTotal({ page: 3, totalElements: 9 })).toBe(9);
  });

  it('returns undefined when no shape carries a number', () => {
    expect(extractPageTotal({ content: [] })).toBeUndefined();
    expect(extractPageTotal({ page: { totalElements: 'many' } })).toBeUndefined();
    expect(extractPageTotal(null)).toBeUndefined();
  });
});
