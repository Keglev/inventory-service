/**
 * @file responseExtraction.test.ts
 * @module tests/api/inventory/responseExtraction
 *
 * @summary
 * Validates the response parsing utilities that sanitize API envelopes before normalization.
 * ResDataOrEmpty and extractArray are exercised across raw data, Axios responses, and malformed payloads.
 *
 * @enterprise
 * - Prevents future regressions that could surface undefined/null data in critical inventory lists
 * - Confirms tolerance for Spring-style envelopes and custom item arrays
 * - Reinforces the contract that helpers never throw and always yield deterministic defaults
 */

import { describe, expect, it } from 'vitest';

import { extractArray, resDataOrEmpty } from '../../../../api/inventory/utils/responseExtraction';

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
