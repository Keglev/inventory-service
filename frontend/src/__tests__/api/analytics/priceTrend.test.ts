/**
 * @file priceTrend.test.ts
 * @module __tests__/api/analytics/priceTrend
 * @description Contract tests for getPriceTrend (api/analytics/priceTrend).
 *
 * Contract under test:
 * - Guarantees itemId is required for an HTTP call (empty itemId
 *   short-circuits)
 * - Guarantees the request contract (endpoint + cleaned date params)
 *   when inputs are provided
 * - Guarantees tolerant parsing/sorting of supported response shapes
 *   into a stable time-series
 *
 * Out of scope:
 * - Trend interpretation, forecasting, or any statistical inference
 *   derived from the series
 * - HTTP client behavior (timeouts, retries, base URL, interceptors)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '@/api/httpClient';
import { getPriceTrend } from '@/api/analytics/priceTrend';
import type { AnalyticsParams } from '@/api/analytics/validation';

describe('api/analytics/priceTrend.getPriceTrend', () => {
  const httpGet = http.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input gating', () => {
    it('returns [] when itemId is empty (no http call)', async () => {
      const itemId = '';

      const res = await getPriceTrend(itemId);

      expect(res).toEqual([]);
      expect(httpGet).not.toHaveBeenCalled();
    });
  });

  describe('request contract', () => {
    it('calls endpoint with itemId + cleaned params', async () => {
      httpGet.mockResolvedValueOnce({ data: [] });

      const params: AnalyticsParams = {
        from: '2025-09-01',
        to: '2025-11-30',
        supplierId: 'SUP-001',
      };

      await getPriceTrend('ITEM-123', params);

      expect(httpGet).toHaveBeenCalledWith('/api/analytics/price-trend', {
        params: {
          itemId: 'ITEM-123',
          start: '2025-09-01',
          end: '2025-11-30',
          supplierId: 'SUP-001',
        },
      });
    });
  });

  describe('response parsing contract', () => {
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
          { timestamp: '2025-10-02', price: null },
          // Rows without a timestamp degrade to '' and sort first.
          { price: 3 },
        ],
      });

      const res = await getPriceTrend('ITEM-123');

      expect(res).toEqual([
        { date: '', price: 3 },
        { date: '2025-10-01', price: 10 },
        { date: '2025-10-02', price: 0 },
        { date: '2025-10-03', price: 12.5 },
      ]);
    });
  });

  describe('transport failures', () => {
    it('returns [] when http throws', async () => {
      httpGet.mockRejectedValueOnce(new Error('network'));

      const res = await getPriceTrend('ITEM-123');

      expect(res).toEqual([]);
    });
  });
});
