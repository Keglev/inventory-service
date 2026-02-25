/**
 * @file lowStock.test.ts
 * @module tests/unit/api/analytics/lowStock
 * @what_is_under_test getLowStockItems (api/analytics/lowStock)
 * @responsibility
 * - Guarantees supplierId is required for an HTTP call (empty supplierId short-circuits)
 * - Guarantees the request contract (endpoint + cleaned date params) when inputs are provided
 * - Guarantees tolerant parsing of supported response envelopes into a stable item list
 * @out_of_scope
 * - Business policy for threshold selection and replenishment workflows
 * - Backend sorting/filtering correctness and authorization rules
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '../../../../api/httpClient';
import { getLowStockItems } from '../../../../api/analytics/lowStock';
import type { AnalyticsParams } from '../../../../api/analytics/validation';

describe('api/analytics/lowStock.getLowStockItems', () => {
  const httpGet = http.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input gating', () => {
    it('returns [] when supplierId is empty (no http call)', async () => {
      const res = await getLowStockItems('');

      expect(res).toEqual([]);
      expect(httpGet).not.toHaveBeenCalled();
    });
  });

  describe('request contract', () => {
    it('calls endpoint with supplierId + cleaned params', async () => {
      httpGet.mockResolvedValueOnce({ data: [] });

      const params: AnalyticsParams = { from: '2025-09-01', to: '2025-11-30' };
      await getLowStockItems('SUP-001', params);

      expect(httpGet).toHaveBeenCalledWith('/api/analytics/low-stock-items', {
        params: { supplierId: 'SUP-001', start: '2025-09-01', end: '2025-11-30' },
      });
    });
  });

  describe('response parsing contract', () => {
    it('accepts a direct array and tolerantly parses fields', async () => {
      httpGet.mockResolvedValueOnce({
        data: [
          { itemName: 'A', quantity: 1, minimumQuantity: 5 },
          { name: 'B', qty: '2', minQty: '10' },
        ],
      });

      const res = await getLowStockItems('SUP-001');

      // Severity sorting is part of the contract (deficit = minimumQuantity - quantity).
      expect(res.map((r) => r.itemName)).toEqual(['B', 'A']);
      expect(res).toEqual([
        { itemName: 'B', quantity: 2, minimumQuantity: 10 },
        { itemName: 'A', quantity: 1, minimumQuantity: 5 },
      ]);
    });

    it('accepts an { items: [...] } envelope and sorts by deficit descending', async () => {
      httpGet.mockResolvedValueOnce({
        data: {
          items: [
            { itemName: 'Less Severe', quantity: 4, minimumQuantity: 5 },
            { itemName: 'More Severe', quantity: 1, minimumQuantity: 10 },
            { itemName: 'Middle', quantity: 2, minimumQuantity: 6 },
          ],
        },
      });

      const res = await getLowStockItems('SUP-001');

      expect(res.map((r) => r.itemName)).toEqual([
        'More Severe',
        'Middle',
        'Less Severe',
      ]);
    });

    it('returns [] when response is neither an array nor { items: array }', async () => {
      httpGet.mockResolvedValueOnce({ data: { items: null } });

      const res = await getLowStockItems('SUP-001');

      expect(res).toEqual([]);
    });
  });

  describe('transport failures', () => {
    it('returns [] when http throws', async () => {
      httpGet.mockRejectedValueOnce(new Error('network'));

      const res = await getLowStockItems('SUP-001');

      expect(res).toEqual([]);
    });
  });
});
