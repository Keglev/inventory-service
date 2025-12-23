/**
 * @file priceTrend.test.ts
 * @module __tests__/unit/api/analytics/priceTrend
 *
 * @summary
 * Test suite for price trend analysis utility functions.
 * Tests price trend calculation and direction analysis.
 *
 * @what_is_under_test Price trend functions - trend direction, slope calculation, momentum
 * @responsibility Analyze price movements, identify trends, calculate rate of change
 * @out_of_scope Market prediction, external API integration, statistical modeling
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '../../../../api/httpClient';
import { getPriceTrend } from '../../../../api/analytics/priceTrend';
import type { AnalyticsParams } from '../../../../api/analytics/validation';

describe('api/analytics/priceTrend.getPriceTrend', () => {
  const httpGet = http.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns [] when itemId is empty (no http call)', async () => {
    const res = await getPriceTrend('');
    expect(res).toEqual([]);
    expect(httpGet).not.toHaveBeenCalled();
  });

  it('calls endpoint with itemId + cleaned params', async () => {
    httpGet.mockResolvedValueOnce({ data: [] });

    const params: AnalyticsParams = { from: '2025-09-01', to: '2025-11-30', supplierId: 'SUP-001' };
    await getPriceTrend('ITEM-123', params);

    expect(httpGet).toHaveBeenCalledWith('/api/analytics/price-trend', {
      params: { itemId: 'ITEM-123', start: '2025-09-01', end: '2025-11-30', supplierId: 'SUP-001' },
    });
  });

  it('returns [] when backend data is not an array', async () => {
    httpGet.mockResolvedValueOnce({ data: { nope: true } });

    const res = await getPriceTrend('ITEM-123');
    expect(res).toEqual([]);
  });

  it('maps rows (timestamp->date, price->number) and sorts by date asc', async () => {
    httpGet.mockResolvedValueOnce({
      data: [
        { timestamp: '2025-10-03', price: '12.5' },
        { timestamp: '2025-10-01', price: 10 },
        { timestamp: '2025-10-02', price: null }, // asNumber(null) should become 0
      ],
    });

    const res = await getPriceTrend('ITEM-123');

    expect(res).toEqual([
      { date: '2025-10-01', price: 10 },
      { date: '2025-10-02', price: 0 },
      { date: '2025-10-03', price: 12.5 },
    ]);
  });

  it('returns [] when http throws', async () => {
    httpGet.mockRejectedValueOnce(new Error('network'));

    const res = await getPriceTrend('ITEM-123');
    expect(res).toEqual([]);
  });
});
