/**
 * @file stock.test.ts
 * @module __tests__/unit/api/analytics/stock
 *
 * @summary
 * Test suite for stock management utility functions.
 * Tests stock operations and inventory calculations.
 *
 * @what_is_under_test Stock utility functions - quantity tracking, balance calculations
 * @responsibility Track stock additions, removals, balance updates, availability checks
 * @out_of_scope Warehouse operations, physical verification, multi-location tracking
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '../../../../api/httpClient';
import {
  getStockValueOverTime,
  getMonthlyStockMovement,
  getStockPerSupplier,
} from '../../../../api/analytics/stock';
import type { AnalyticsParams } from '../../../../api/analytics/validation';

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
          { date: '2025-10-02', totalValue: null }, // -> 0 via asNumber
        ],
      });

      const params: AnalyticsParams = { from: '2025-10-01', to: '2025-10-31', supplierId: 'SUP-001' };
      const res = await getStockValueOverTime(params);

      // paramClean converts from/to -> start/end in your project
      expect(httpGet).toHaveBeenCalledWith('/api/analytics/stock-value', {
        params: { start: '2025-10-01', end: '2025-10-31', supplierId: 'SUP-001' },
      });

      expect(res).toEqual([
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
          { month: '2025-11', stockIn: null, stockOut: '5' }, // null -> 0
        ],
      });

      const res = await getMonthlyStockMovement({ from: '2025-10-01', to: '2025-11-30' });

      expect(res).toEqual([
        { month: '2025-10', stockIn: 7, stockOut: 2 },
        { month: '2025-11', stockIn: 0, stockOut: 5 },
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

    it('maps rows and filters out empty supplierName', async () => {
      httpGet.mockResolvedValueOnce({
        data: [
          { supplierName: 'Supplier A', totalQuantity: '10' },
          { supplierName: '', totalQuantity: 99 },            // filtered (empty string)
          { totalQuantity: 12 },                              // supplierName missing -> '' -> filtered
          { supplierName: 'Supplier B', totalQuantity: null }, // null -> 0
        ],
      });

      const res = await getStockPerSupplier();

      expect(httpGet).toHaveBeenCalledWith('/api/analytics/stock-per-supplier');

      expect(res).toEqual([
        { supplierName: 'Supplier A', totalQuantity: 10 },
        { supplierName: 'Supplier B', totalQuantity: 0 },
      ]);
    });

    it('returns [] when http throws', async () => {
      httpGet.mockRejectedValueOnce(new Error('network'));

      const res = await getStockPerSupplier();
      expect(res).toEqual([]);
    });
  });
});
