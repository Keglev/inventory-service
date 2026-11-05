/**
 * @file metrics.test.ts
 * @module __tests__/api/analytics/metrics
 * @description Contract tests for api/analytics/metrics module.
 *
 * Contract under test:
 * - Guarantees each exported metric function calls the expected endpoint
 *   and returns a numeric result
 * - Guarantees failures and non-numeric payloads are normalized to a
 *   safe default (0)
 *
 * Out of scope:
 * - HTTP client behavior (timeouts, interceptors, retries, base URL)
 * - Backend correctness of the reported counts and authorization rules
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '@/api/httpClient';

import {
  getItemCount,
  getSupplierCount,
  getLowStockCount,
} from '@/api/analytics/metrics';

describe('api/analytics/metrics', () => {
  const httpGet = http.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getItemCount', () => {
    it('calls /api/inventory/count and returns numeric data', async () => {
      httpGet.mockResolvedValueOnce({ data: 150 });

      const res = await getItemCount();

      expect(httpGet).toHaveBeenCalledWith('/api/inventory/count');
      expect(res).toBe(150);
    });

    it('tolerantly converts string data to number', async () => {
      httpGet.mockResolvedValueOnce({ data: '42' });

      const res = await getItemCount();

      expect(res).toBe(42);
    });

    it('returns 0 on undefined/null payloads', async () => {
      httpGet.mockResolvedValueOnce({ data: undefined });

      const res1 = await getItemCount();

      expect(res1).toBe(0);

      httpGet.mockResolvedValueOnce({ data: null });

      const res2 = await getItemCount();

      expect(res2).toBe(0);
    });

    it('returns 0 on error', async () => {
      httpGet.mockRejectedValueOnce(new Error('network'));

      const res = await getItemCount();

      expect(res).toBe(0);
    });
  });

  describe('getSupplierCount', () => {
    it('calls /api/suppliers/count and returns numeric data', async () => {
      httpGet.mockResolvedValueOnce({ data: 25 });

      const res = await getSupplierCount();

      expect(httpGet).toHaveBeenCalledWith('/api/suppliers/count');
      expect(res).toBe(25);
    });

    it('returns 0 on a null payload', async () => {
      httpGet.mockResolvedValueOnce({ data: null });

      const res = await getSupplierCount();

      expect(res).toBe(0);
    });

    it('returns 0 on error', async () => {
      httpGet.mockRejectedValueOnce(new Error('network'));

      const res = await getSupplierCount();

      expect(res).toBe(0);
    });
  });

  describe('getLowStockCount', () => {
    it('returns 0 on a null payload', async () => {
      httpGet.mockResolvedValueOnce({ data: null });

      const res = await getLowStockCount();

      expect(res).toBe(0);
    });

    it('calls /api/analytics/low-stock/count and returns numeric data', async () => {
      httpGet.mockResolvedValueOnce({ data: 12 });

      const res = await getLowStockCount();

      expect(httpGet).toHaveBeenCalledWith('/api/analytics/low-stock/count');
      expect(res).toBe(12);
    });

    it('returns 0 on error', async () => {
      httpGet.mockRejectedValueOnce(new Error('network'));

      const res = await getLowStockCount();

      expect(res).toBe(0);
    });
  });

});
