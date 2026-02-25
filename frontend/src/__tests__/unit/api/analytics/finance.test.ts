/**
 * @file finance.test.ts
 * @module tests/unit/api/analytics/finance
 * @what_is_under_test getFinancialSummary (api/analytics/finance)
 * @responsibility
 * - Guarantees the function builds the request contract (endpoint + query params)
 * - Guarantees tolerant parsing of supported response envelopes and field aliases
 * - Guarantees a stable zero-value object on transport or payload-shape failures
 * @out_of_scope
 * - Financial correctness of backend aggregation (COGS, purchases, write-offs)
 * - Tax rules, currency conversion, and any accounting/reporting compliance semantics
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
  const ZERO_SUMMARY = {
    purchases: 0,
    cogs: 0,
    writeOffs: 0,
    returns: 0,
    openingValue: 0,
    endingValue: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('error and fallback behavior', () => {
    it('returns a zero-value summary when http throws', async () => {
      // Arrange
      vi.mocked(http.get).mockRejectedValueOnce(new Error('network'));

      // Act
      const res = await getFinancialSummary({ from: '2025-01-01', to: '2025-01-31' });

      // Assert
      expect(res).toEqual(ZERO_SUMMARY);
    });

    it('returns a zero-value summary when payload is not a record', async () => {
      // Arrange
      vi.mocked(http.get).mockResolvedValueOnce({ data: { data: null } });

      // Act
      const res = await getFinancialSummary();

      // Assert
      expect(res).toEqual(ZERO_SUMMARY);
    });
  });

  describe('request contract', () => {
    it('builds params from from/to/supplierId when provided', async () => {
      // Arrange
      vi.mocked(http.get).mockResolvedValueOnce({ data: {} });

      // Act
      await getFinancialSummary({
        from: '2025-09-01',
        to: '2025-11-30',
        supplierId: 'SUP-001',
      });

      // Assert
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith('/api/analytics/financial/summary', {
        params: { from: '2025-09-01', to: '2025-11-30', supplierId: 'SUP-001' },
      });
    });

    it('omits param keys that are not provided', async () => {
      // Arrange
      vi.mocked(http.get).mockResolvedValueOnce({ data: {} });

      // Act
      await getFinancialSummary({ supplierId: 'SUP-XYZ' });

      // Assert
      expect(http.get).toHaveBeenCalledWith('/api/analytics/financial/summary', {
        params: { supplierId: 'SUP-XYZ' },
      });
    });
  });

  describe('response parsing contract', () => {
    it('parses a direct summary object', async () => {
      // Arrange
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

      // Act
      const res = await getFinancialSummary({
        from: '2025-09-01',
        to: '2025-11-30',
        supplierId: 'SUP-001',
      });

      // Assert
      expect(res).toEqual({
        purchases: 100,
        cogs: 40,
        writeOffs: 2,
        returns: 3,
        openingValue: 10,
        endingValue: 20,
      });
    });

    it('accepts a { summary } envelope and maps supported alias fields', async () => {
      // Arrange
      vi.mocked(http.get).mockResolvedValueOnce({
        data: {
          summary: {
            totalPurchases: '200',
            costOfGoodsSold: '80',
            write_offs: '5',
            salesReturns: '7',
            startValue: '11',
            endValue: '22',
          },
        },
      });

      // Act
      const res = await getFinancialSummary({ from: '2025-01-01', to: '2025-01-31' });

      // Assert
      expect(res).toEqual({
        purchases: 200,
        cogs: 80,
        writeOffs: 5,
        returns: 7,
        openingValue: 11,
        endingValue: 22,
      });
    });
  });
});
