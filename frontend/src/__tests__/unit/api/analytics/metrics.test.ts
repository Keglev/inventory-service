/**
 * @file metrics.test.ts
 * @module tests/unit/api/analytics/metrics
 * @what_is_under_test api/analytics/metrics module
 * @responsibility
 * - Guarantees each exported metric function calls the expected endpoint and returns a numeric result
 * - Guarantees failures and non-numeric payloads are normalized to a safe default (0)
 * @out_of_scope
 * - HTTP client behavior (timeouts, interceptors, retries, base URL)
 * - Backend correctness of the reported counts and authorization rules
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '../../../../api/httpClient';

import {
  getItemCount,
  getSupplierCount,
  getLowStockCount,
} from '../../../../api/analytics/metrics';

describe('api/analytics/metrics', () => {
  const httpGet = http.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getItemCount', () => {
    it('calls /api/inventory/count and returns numeric data', async () => {
      // Arrange
      httpGet.mockResolvedValueOnce({ data: 150 });

      // Act
      const res = await getItemCount();

      // Assert
      expect(httpGet).toHaveBeenCalledWith('/api/inventory/count');
      expect(res).toBe(150);
    });

    it('tolerantly converts string data to number', async () => {
      // Arrange
      httpGet.mockResolvedValueOnce({ data: '42' });

      // Act
      const res = await getItemCount();

      // Assert
      expect(res).toBe(42);
    });

    it('returns 0 on undefined/null payloads', async () => {
      // Arrange
      httpGet.mockResolvedValueOnce({ data: undefined });

      // Act
      const res1 = await getItemCount();

      // Assert
      expect(res1).toBe(0);

      // Arrange
      httpGet.mockResolvedValueOnce({ data: null });

      // Act
      const res2 = await getItemCount();

      // Assert
      expect(res2).toBe(0);
    });

    it('returns 0 on error', async () => {
      // Arrange
      httpGet.mockRejectedValueOnce(new Error('network'));

      // Act
      const res = await getItemCount();

      // Assert
      expect(res).toBe(0);
    });
  });

  describe('getSupplierCount', () => {
    it('calls /api/suppliers/count and returns numeric data', async () => {
      // Arrange
      httpGet.mockResolvedValueOnce({ data: 25 });

      // Act
      const res = await getSupplierCount();

      // Assert
      expect(httpGet).toHaveBeenCalledWith('/api/suppliers/count');
      expect(res).toBe(25);
    });

    it('returns 0 on error', async () => {
      // Arrange
      httpGet.mockRejectedValueOnce(new Error('network'));

      // Act
      const res = await getSupplierCount();

      // Assert
      expect(res).toBe(0);
    });
  });

  describe('getLowStockCount', () => {
    it('calls /api/analytics/low-stock/count and returns numeric data', async () => {
      // Arrange
      httpGet.mockResolvedValueOnce({ data: 12 });

      // Act
      const res = await getLowStockCount();

      // Assert
      expect(httpGet).toHaveBeenCalledWith('/api/analytics/low-stock/count');
      expect(res).toBe(12);
    });

    it('returns 0 on error', async () => {
      // Arrange
      httpGet.mockRejectedValueOnce(new Error('network'));

      // Act
      const res = await getLowStockCount();

      // Assert
      expect(res).toBe(0);
    });
  });

});
