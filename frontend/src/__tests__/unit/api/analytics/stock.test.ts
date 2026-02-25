/**
 * @file stock.test.ts
 * @module tests/unit/api/analytics/stock
 * @what_is_under_test getStockValueOverTime, getMonthlyStockMovement, getStockPerSupplier (api/analytics/stock)
 * @responsibility
 * - Guarantees tolerant parsing of supported response shapes into stable DTO arrays
 * - Guarantees request parameter cleaning (date fields) where applicable
 * - Guarantees transport failures produce safe empty arrays (no thrown errors)
 * @out_of_scope
 * - Backend aggregation correctness (valuation math, movement logic, supplier totals)
 * - HTTP client behavior (timeouts, retries, base URL, interceptors)
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
      // Arrange
      httpGet.mockResolvedValueOnce({ data: { nope: true } });

      // Act
      const res = await getStockValueOverTime({ from: '2025-09-01', to: '2025-11-30' });

      // Assert
      expect(res).toEqual([]);
    });

    it('calls endpoint with cleaned params and sorts by date asc', async () => {
      // Arrange
      httpGet.mockResolvedValueOnce({
        data: [
          { date: '2025-10-03', totalValue: '12.5' },
          { date: '2025-10-01', totalValue: 10 },
          { date: '2025-10-02', totalValue: null },
        ],
      });

      const params: AnalyticsParams = { from: '2025-10-01', to: '2025-10-31', supplierId: 'SUP-001' };

      // Act
      const res = await getStockValueOverTime(params);

      // Assert
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
      // Arrange
      httpGet.mockRejectedValueOnce(new Error('network'));

      // Act
      const res = await getStockValueOverTime();

      // Assert
      expect(res).toEqual([]);
    });
  });

  describe('getMonthlyStockMovement', () => {
    it('returns [] when backend data is not an array', async () => {
      // Arrange
      httpGet.mockResolvedValueOnce({ data: 'nope' });

      // Act
      const res = await getMonthlyStockMovement({ from: '2025-10-01', to: '2025-10-31' });

      // Assert
      expect(res).toEqual([]);
    });

    it('maps rows with tolerant number parsing (string/null)', async () => {
      // Arrange
      httpGet.mockResolvedValueOnce({
        data: [
          { month: '2025-10', stockIn: '7', stockOut: 2 },
          { month: '2025-11', stockIn: null, stockOut: '5' },
        ],
      });

      // Act
      const res = await getMonthlyStockMovement({ from: '2025-10-01', to: '2025-11-30' });

      // Assert
      expect(res).toEqual([
        { month: '2025-10', stockIn: 7, stockOut: 2 },
        { month: '2025-11', stockIn: 0, stockOut: 5 },
      ]);
    });

    it('returns [] when http throws', async () => {
      // Arrange
      httpGet.mockRejectedValueOnce(new Error('network'));

      // Act
      const res = await getMonthlyStockMovement();

      // Assert
      expect(res).toEqual([]);
    });
  });

  describe('getStockPerSupplier', () => {
    it('returns [] when backend data is not an array', async () => {
      // Arrange
      httpGet.mockResolvedValueOnce({ data: { nope: true } });

      // Act
      const res = await getStockPerSupplier();

      // Assert
      expect(res).toEqual([]);
    });

    it('maps rows and filters out empty supplierName', async () => {
      // Arrange
      httpGet.mockResolvedValueOnce({
        data: [
          { supplierName: 'Supplier A', totalQuantity: '10' },
          { supplierName: '', totalQuantity: 99 },
          { totalQuantity: 12 },
          { supplierName: 'Supplier B', totalQuantity: null },
        ],
      });

      // Act
      const res = await getStockPerSupplier();

      // Assert
      expect(httpGet).toHaveBeenCalledWith('/api/analytics/stock-per-supplier');

      expect(res).toEqual([
        { supplierName: 'Supplier A', totalQuantity: 10 },
        { supplierName: 'Supplier B', totalQuantity: 0 },
      ]);
    });

    it('returns [] when http throws', async () => {
      // Arrange
      httpGet.mockRejectedValueOnce(new Error('network'));

      // Act
      const res = await getStockPerSupplier();

      // Assert
      expect(res).toEqual([]);
    });
  });
});
