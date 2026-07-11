/**
 * @file employees.test.ts
 * @module __tests__/unit/api/analytics/employees
 * @description Request contract + Spring Page parsing for the per-employee analytics
 * fetchers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '../../../../api/httpClient';
import { getEmployeeActivity, getEmployeeChanges } from '../../../../api/analytics/employees';

describe('api/analytics/employees', () => {
  const httpGet = http.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEmployeeActivity', () => {
    it('sends granularity and ISO DATE bounds', async () => {
      httpGet.mockResolvedValueOnce({ data: [] });

      await getEmployeeActivity({ granularity: 'weekly', from: '2026-01-01', to: '2026-03-31' });

      expect(httpGet).toHaveBeenCalledWith('/api/analytics/by-employee', {
        params: { granularity: 'weekly', startDate: '2026-01-01', endDate: '2026-03-31', supplierId: undefined },
      });
    });

    it('maps rows and falls back displayName to createdBy', async () => {
      httpGet.mockResolvedValueOnce({
        data: [
          { period: '2026-03', createdBy: 'jonas.weber@example.com', displayName: 'Jonas Weber', changeCount: 5 },
          { period: '2026-03', createdBy: 'ghost@example.com', changeCount: 2 },
        ],
      });

      const rows = await getEmployeeActivity();

      expect(rows).toEqual([
        { period: '2026-03', createdBy: 'jonas.weber@example.com', displayName: 'Jonas Weber', changeCount: 5 },
        { period: '2026-03', createdBy: 'ghost@example.com', displayName: 'ghost@example.com', changeCount: 2 },
      ]);
    });

    it('returns [] on error', async () => {
      httpGet.mockRejectedValueOnce(new Error('network'));
      expect(await getEmployeeActivity()).toEqual([]);
    });
  });

  describe('getEmployeeChanges', () => {
    it('sends pagination defaults and parses the Spring Page shape', async () => {
      httpGet.mockResolvedValueOnce({
        data: {
          content: [
            {
              timestamp: '2026-02-03T09:00:00',
              itemName: 'Item A',
              supplierName: 'Supplier One',
              change: -3,
              reason: 'SOLD',
              createdBy: 'jonas.weber@example.com',
            },
          ],
          totalElements: 41,
          number: 0,
          size: 25,
        },
      });

      const page = await getEmployeeChanges({ from: '2026-02-01', to: '2026-02-28' });

      expect(httpGet).toHaveBeenCalledWith('/api/analytics/employee-changes', {
        params: {
          createdBy: undefined,
          supplierId: undefined,
          startDate: '2026-02-01',
          endDate: '2026-02-28',
          page: 0,
          size: 25,
        },
      });
      expect(page.total).toBe(41);
      expect(page.rows).toHaveLength(1);
      expect(page.rows[0]).toMatchObject({ itemName: 'Item A', change: -3, reason: 'SOLD' });
    });

    it('returns an empty page on malformed payloads and on errors', async () => {
      httpGet.mockResolvedValueOnce({ data: { content: 'nope' } });
      expect(await getEmployeeChanges()).toEqual({ rows: [], total: 0 });

      httpGet.mockRejectedValueOnce(new Error('network'));
      expect(await getEmployeeChanges()).toEqual({ rows: [], total: 0 });
    });
  });
});
