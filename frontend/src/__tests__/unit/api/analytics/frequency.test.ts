/**
 * @file frequency.test.ts
 * @module __tests__/unit/api/analytics/frequency
 *
 * @summary
 * Test suite for frequency analysis utility functions.
 * Tests frequency calculations and distribution analysis.
 *
 * @what_is_under_test Frequency analysis functions - occurrence counting, distribution calculation
 * @responsibility Calculate item frequencies, ranking, distribution percentages
 * @out_of_scope Statistical inference, probability distributions, forecasting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the http client used by frequency.ts
vi.mock('../../../../api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '../../../../api/httpClient';
import { getItemUpdateFrequency } from '../../../../api/analytics/frequency';

describe('api/analytics/frequency.getItemUpdateFrequency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns [] when supplierId is empty (no http call)', async () => {
    const res = await getItemUpdateFrequency('');
    expect(res).toEqual([]);
    expect(http.get).not.toHaveBeenCalled();
  });

  it('returns [] when response is not an array of records', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ data: { nope: true } });

    const res = await getItemUpdateFrequency('SUP-001');
    expect(res).toEqual([]);
  });

  it('normalizes records and uses name as id when id is missing', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: [
        { itemName: 'Item A', updateCount: 3 },                 // no id -> id=name
        { id: 'I-2', name: 'Item B', updates: 5 },              // direct fields
        { sku: 'SKU-3', itemName: 'Item C', changes: '7' },     // tolerant keys + string -> number
      ],
    });

    const res = await getItemUpdateFrequency('SUP-001', 10);

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith('/api/analytics/item-update-frequency', {
      params: { supplierId: 'SUP-001', limit: 10 },
    });

    expect(res).toEqual([
      { id: 'Item A', name: 'Item A', updates: 3 },
      { id: 'I-2', name: 'Item B', updates: 5 },
      { id: 'SKU-3', name: 'Item C', updates: 7 },
    ]);
  });

  it('filters out records without a name', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: [
        { id: 'X', updates: 1 }, // missing name/itemName => filtered
        { name: 'Good', count: 2 },
      ],
    });

    const res = await getItemUpdateFrequency('SUP-001', 10);
    expect(res).toEqual([{ id: 'Good', name: 'Good', updates: 2 }]);
  });

  it('applies limit by slicing after parsing', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: [
        { name: 'A', updates: 1 },
        { name: 'B', updates: 2 },
        { name: 'C', updates: 3 },
      ],
    });

    const res = await getItemUpdateFrequency('SUP-001', 2);
    expect(res).toEqual([
      { id: 'A', name: 'A', updates: 1 },
      { id: 'B', name: 'B', updates: 2 },
    ]);
  });

  it('returns [] when http throws', async () => {
    vi.mocked(http.get).mockRejectedValueOnce(new Error('network'));

    const res = await getItemUpdateFrequency('SUP-001');
    expect(res).toEqual([]);
  });
});
