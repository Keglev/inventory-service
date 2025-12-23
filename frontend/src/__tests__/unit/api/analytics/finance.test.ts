/**
 * @file finance.test.ts
 * @module __tests__/unit/api/analytics/finance
 *
 * @summary
 * Test suite for finance utility functions.
 * Tests financial calculations and metrics.
 *
 * @what_is_under_test Finance calculation functions - margin, revenue, cost analysis
 * @responsibility Calculate gross margin, net margin, revenue metrics, profit calculations
 * @out_of_scope Tax calculations, currency conversions, financial reporting standards
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the http client used by finance.ts
vi.mock('../../../../api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '../../../../api/httpClient';
import { getFinancialSummary } from '../../../../api/analytics/finance';

describe('api/analytics/finance.getFinancialSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ZERO object when http throws', async () => {
    vi.mocked(http.get).mockRejectedValueOnce(new Error('network'));

    const res = await getFinancialSummary({ from: '2025-01-01', to: '2025-01-31' });

    expect(res).toEqual({
      purchases: 0,
      cogs: 0,
      writeOffs: 0,
      returns: 0,
      openingValue: 0,
      endingValue: 0,
    });
  });

  it('builds params correctly (from/to/supplierId) and parses direct object', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: {
        purchases: 100,
        cogs: 40,
        writeOffs: 2,
        returns: 3,
        openingValue: 10,
        endingValue: 20,
      },
    });

    const res = await getFinancialSummary({
      from: '2025-09-01',
      to: '2025-11-30',
      supplierId: 'SUP-001',
    });

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith('/api/analytics/financial/summary', {
      params: { from: '2025-09-01', to: '2025-11-30', supplierId: 'SUP-001' },
    });

    expect(res).toEqual({
      purchases: 100,
      cogs: 40,
      writeOffs: 2,
      returns: 3,
      openingValue: 10,
      endingValue: 20,
    });
  });

  it('accepts envelope { summary } and tolerantly maps alternate field names', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: {
        summary: {
          // alternate keys your parser accepts
          totalPurchases: '200',
          costOfGoodsSold: '80',
          write_offs: '5',
          salesReturns: '7',
          startValue: '11',
          endValue: '22',
        },
      },
    });

    const res = await getFinancialSummary({ from: '2025-01-01', to: '2025-01-31' });

    expect(res).toEqual({
      purchases: 200,
      cogs: 80,
      writeOffs: 5,
      returns: 7,
      openingValue: 11,
      endingValue: 22,
    });
  });

  it('accepts envelope { data } and returns ZERO when payload is not a record', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: { data: null },
    });

    const res = await getFinancialSummary();

    expect(res).toEqual({
      purchases: 0,
      cogs: 0,
      writeOffs: 0,
      returns: 0,
      openingValue: 0,
      endingValue: 0,
    });
  });

  it('omits params keys when not provided', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ data: {} });

    await getFinancialSummary({ supplierId: 'SUP-XYZ' });

    expect(http.get).toHaveBeenCalledWith('/api/analytics/financial/summary', {
      params: { supplierId: 'SUP-XYZ' },
    });
  });
});
