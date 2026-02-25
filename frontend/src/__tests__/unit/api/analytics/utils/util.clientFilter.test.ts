/**
 * @file util.clientFilter.test.ts
 * @module tests/unit/api/analytics/util.clientFilter
 * @what_is_under_test clientFilter (api/analytics/util)
 * @responsibility
 * - Guarantees filtering is case-insensitive and returns only items matching the query
 * - Guarantees limit is applied to the returned list
 * @out_of_scope
 * - Relevance scoring, fuzzy matching, stemming, or locale-specific collation
 * - Performance characteristics for very large datasets
 */

import { describe, it, expect } from 'vitest';
import { clientFilter } from '@/api/analytics/util';

describe('clientFilter', () => {
  const items = [
    { id: '1', name: 'Apple' },
    { id: '2', name: 'Banana' },
    { id: '3', name: 'Cherry' },
  ];

  it('filters items by search query case-insensitive', () => {
    const result = clientFilter(items, 'ban', 10);

    expect(result).toEqual([{ id: '2', name: 'Banana' }]);
  });

  it('returns first N items when query is empty', () => {
    const result = clientFilter(items, '', 2);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Apple');
  });

  it('respects limit parameter', () => {
    const many = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      name: `Item ${i}`,
    }));

    const result = clientFilter(many, '', 5);

    expect(result).toHaveLength(5);
  });
});
