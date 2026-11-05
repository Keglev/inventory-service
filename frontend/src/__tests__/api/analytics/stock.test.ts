/**
 * @file stock.test.ts
 * @module __tests__/api/analytics/stock
 * @description Contract tests for getStockValueOverTime, getMonthlyStockMovement,
 * getStockPerSupplier (api/analytics/stock).
 *
 * Contract under test:
 * - Guarantees tolerant parsing of supported response shapes into stable
 *   DTO arrays
 * - Guarantees request parameter cleaning (date fields) where applicable
 * - Guarantees transport failures produce safe empty arrays (no thrown
 *   errors)
 *
 * Out of scope:
 * - Backend aggregation correctness (valuation math, movement logic,
 *   supplier totals)
 * - HTTP client behavior (timeouts, retries, base URL, interceptors)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '@/api/httpClient';
import {
  getStockValueOverTime,
  getMonthlyStockMovement,
  getStockPerSupplier,
} from '@/api/analytics/stock';
import type { AnalyticsParams } from '@/api/analytics/validation';

describe('api/analytics/stock', () => {
  const httpGet = http.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStockValueOverTime', () => {
    it('returns [] when backend data is not an array', async () => {
      httpGet.mockResolvedValueOnce({ data: { nope: true } });

      const res = await getStockValueOverTime({ from: '2025-09-01', to: '2025-11-30' });

      expect(res).toEqual([]);
    });

    it('calls endpoint with cleaned params and sorts by date asc', async () => {
      httpGet.mockResolvedValueOnce({
        data: [
          { date: '2025-10-03', totalValue: '12.5' },
          { date: '2025-10-01', totalValue: 10 },
          { date: '2025-10-02', totalValue: null },
          // Rows without a date degrade to '' and sort first.
          { totalValue: 3 },
        ],
      });

      const params: AnalyticsParams = { from: '2025-10-01', to: '2025-10-31', supplierId: 'SUP-001' };

      const res = await getStockValueOverTime(params);

      expect(httpGet).toHaveBeenCalledWith('/api/analytics/stock-value', {
        params: { start: '2025-10-01', end: '2025-10-31', supplierId: 'SUP-001' },
      });

      expect(res).toEqual([
        { date: '', totalValue: 3 },
        { date: '2025-10-01', totalValue: 10 },
        { date: '2025-10-02', totalValue: 0 },
        { date: '2025-10-03', totalValue: 12.5 },
      ]);
    });

    it('returns [] when http throws', async () => {
      httpGet.mockRejectedValueOnce(new Error('network'));

      const res = await getStockValueOverTime();

      expect(res).toEqual([]);
    });
  });

  describe('getMonthlyStockMovement', () => {
    it('returns [] when backend data is not an array', async () => {
      httpGet.mockResolvedValueOnce({ data: 'nope' });

      const res = await getMonthlyStockMovement({ from: '2025-10-01', to: '2025-10-31' });

      expect(res).toEqual([]);
    });

    it('maps rows with tolerant number parsing (string/null)', async () => {
      httpGet.mockResolvedValueOnce({
        data: [
          { month: '2025-10', stockIn: '7', stockOut: 2 },
          { month: '2025-11', stockIn: null, stockOut: '5' },
          // Rows without a month degrade to ''.
          { stockIn: 1, stockOut: 1 },
        ],
      });

      const res = await getMonthlyStockMovement({ from: '2025-10-01', to: '2025-11-30' });

      expect(res).toEqual([
        { month: '2025-10', stockIn: 7, stockOut: 2 },
        { month: '2025-11', stockIn: 0, stockOut: 5 },
        { month: '', stockIn: 1, stockOut: 1 },
      ]);
    });

    it('returns [] when http throws', async () => {
      httpGet.mockRejectedValueOnce(new Error('network'));

      const res = await getMonthlyStockMovement();

      expect(res).toEqual([]);
    });
  });

  describe('getStockPerSupplier', () => {
    it('returns [] when backend data is not an array', async () => {
      httpGet.mockResolvedValueOnce({ data: { nope: true } });

      const res = await getStockPerSupplier();

      expect(res).toEqual([]);
    });

    it('maps quantity and value and filters out an empty supplierName', async () => {
      httpGet.mockResolvedValueOnce({
        data: [
          { supplierName: 'Supplier A', totalQuantity: '10', totalValue: 250.5 },
          { supplierName: '', totalQuantity: 99, totalValue: 1 },
          { totalQuantity: 12, totalValue: 1 },
          { supplierName: 'Supplier B', totalQuantity: null },
        ],
      });

      const res = await getStockPerSupplier();

      expect(httpGet).toHaveBeenCalledWith('/api/analytics/stock-per-supplier');

      expect(res).toEqual([
        { supplierName: 'Supplier A', totalQuantity: 10, totalValue: 250.5 },
        { supplierName: 'Supplier B', totalQuantity: 0, totalValue: 0 },
      ]);
    });

    it('returns [] when http throws', async () => {
      httpGet.mockRejectedValueOnce(new Error('network'));

      const res = await getStockPerSupplier();

      expect(res).toEqual([]);
    });
  });
});
