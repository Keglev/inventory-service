/**
 * @file util.normalizeItemsList.test.ts
 * @module tests/unit/api/analytics/util.normalizeItemsList
 * @what_is_under_test normalizeItemsList (api/analytics/util)
 * @responsibility
 * - Guarantees item-like payloads are normalized into stable {id,name,supplierId} objects
 * - Guarantees invalid entries are filtered out rather than producing partial/unsafe DTOs
 * @out_of_scope
 * - Enforcing uniqueness, ordering guarantees, or deep validation of item fields
 * - Backend contract correctness for identifiers and naming
 */

import { describe, it, expect } from 'vitest';
import { normalizeItemsList } from '@/api/analytics/util';

describe('normalizeItemsList', () => {
  it('normalizes items with id and name', () => {
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

  it('uses itemId and itemName as fallbacks', () => {
    const data = [{ itemId: '10', itemName: 'Fallback Item' }];

    const result = normalizeItemsList(data);

    expect(result).toEqual([
      { id: '10', name: 'Fallback Item', supplierId: undefined },
    ]);
  });

  it('includes supplierId when present', () => {
    const data = [{ id: '5', name: 'With Supplier', supplierId: 'S100' }];

    const result = normalizeItemsList(data);

    expect(result).toEqual([{ id: '5', name: 'With Supplier', supplierId: 'S100' }]);
  });

  it('filters out entries without id or name', () => {
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

  it('returns [] for non-array input', () => {
    expect(normalizeItemsList(null)).toEqual([]);
    expect(normalizeItemsList(undefined)).toEqual([]);
    expect(normalizeItemsList('string')).toEqual([]);
    expect(normalizeItemsList({})).toEqual([]);
  });
});
