/**
 * @file dashboardSummary.test.ts
 * @module tests/unit/api/analytics/dashboardSummary
 * @description Contract tests for getDashboardLowStock (api/analytics/dashboardSummary).
 *
 * Contract under test:
 * - Calls GET /api/analytics/summary with no params.
 * - Extracts and tolerantly parses lowStockItems into a stable row list.
 * - Collapses missing payloads and transport errors to an empty list.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../api/httpClient', () => ({
  default: { get: vi.fn() },
}));

import http from '../../../../api/httpClient';
import { getDashboardLowStock } from '../../../../api/analytics/dashboardSummary';

describe('api/analytics/dashboardSummary.getDashboardLowStock', () => {
  const httpGet = http.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the summary endpoint with no params', async () => {
    httpGet.mockResolvedValueOnce({ data: { lowStockItems: [] } });
    await getDashboardLowStock();
    expect(httpGet).toHaveBeenCalledWith('/api/analytics/summary');
  });

  it('extracts and tolerantly parses lowStockItems', async () => {
    httpGet.mockResolvedValueOnce({
      data: {
        lowStockItems: [
          { itemName: 'ItemA', quantity: 2, minimumQuantity: 10 },
          { itemName: '', quantity: 1, minimumQuantity: 5 },
        ],
      },
    });
    const rows = await getDashboardLowStock();
    expect(rows).toEqual([{ itemName: 'ItemA', quantity: 2, minimumQuantity: 10 }]);
  });

  it('returns [] when lowStockItems is missing', async () => {
    httpGet.mockResolvedValueOnce({ data: {} });
    expect(await getDashboardLowStock()).toEqual([]);
  });

  it('returns [] on transport error', async () => {
    httpGet.mockRejectedValueOnce(new Error('network'));
    expect(await getDashboardLowStock()).toEqual([]);
  });
});
