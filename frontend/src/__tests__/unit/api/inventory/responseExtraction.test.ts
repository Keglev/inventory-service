/**
 * @file responseExtraction.test.ts
 * @module tests/unit/api/inventory/responseExtraction
 * @description Contract tests for resDataOrEmpty / extractArray.
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

import { extractArray, resDataOrEmpty } from '../../../../api/shared/responseExtraction';

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
