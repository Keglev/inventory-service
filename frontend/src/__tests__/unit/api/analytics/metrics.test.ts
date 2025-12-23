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
  getInventoryCount,
  getSuppliersCount,
} from '../../../../api/analytics/metrics';

describe('api/analytics/metrics', () => {
  const httpGet = http.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getItemCount calls /api/inventory/count and returns numeric data', async () => {
    httpGet.mockResolvedValueOnce({ data: 150 });

    const res = await getItemCount();

    expect(httpGet).toHaveBeenCalledWith('/api/inventory/count');
    expect(res).toBe(150);
  });

  it('getItemCount tolerantly converts string data to number', async () => {
    httpGet.mockResolvedValueOnce({ data: '42' });

    const res = await getItemCount();
    expect(res).toBe(42);
  });

  it('getItemCount returns 0 on undefined/null', async () => {
    httpGet.mockResolvedValueOnce({ data: undefined });

    const res1 = await getItemCount();
    expect(res1).toBe(0);

    httpGet.mockResolvedValueOnce({ data: null });

    const res2 = await getItemCount();
    expect(res2).toBe(0);
  });

  it('getItemCount returns 0 on error', async () => {
    httpGet.mockRejectedValueOnce(new Error('network'));

    const res = await getItemCount();
    expect(res).toBe(0);
  });

  it('getSupplierCount calls /api/suppliers/count and returns numeric data', async () => {
    httpGet.mockResolvedValueOnce({ data: 25 });

    const res = await getSupplierCount();

    expect(httpGet).toHaveBeenCalledWith('/api/suppliers/count');
    expect(res).toBe(25);
  });

  it('getSupplierCount returns 0 on error', async () => {
    httpGet.mockRejectedValueOnce(new Error('network'));

    const res = await getSupplierCount();
    expect(res).toBe(0);
  });

  it('getLowStockCount calls /api/analytics/low-stock/count and returns numeric data', async () => {
    httpGet.mockResolvedValueOnce({ data: 12 });

    const res = await getLowStockCount();

    expect(httpGet).toHaveBeenCalledWith('/api/analytics/low-stock/count');
    expect(res).toBe(12);
  });

  it('getLowStockCount returns 0 on error', async () => {
    httpGet.mockRejectedValueOnce(new Error('network'));

    const res = await getLowStockCount();
    expect(res).toBe(0);
  });

  it('exports backward-compatible aliases', () => {
    expect(getInventoryCount).toBe(getItemCount);
    expect(getSuppliersCount).toBe(getSupplierCount);
  });
});
