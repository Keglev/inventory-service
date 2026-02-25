/**
 * @file updates.test.ts
 * @module tests/unit/api/analytics/updates
 * @what_is_under_test getStockUpdates (api/analytics/updates)
 * @responsibility
 * - Guarantees the request contract (endpoint + parameter mapping) for date range queries
 * - Guarantees tolerant parsing/filtering of supported row shapes into a stable DTO list
 * - Guarantees transport failures or unsupported payload shapes return a safe empty list
 * @out_of_scope
 * - Backend pagination, ordering guarantees, and audit semantics
 * - Real-time streaming, push notifications, and cache invalidation strategies
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '../../../../api/httpClient';
import { getStockUpdates } from '../../../../api/analytics/updates';

describe('api/analytics/updates.getStockUpdates', () => {
  const httpGet = http.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('request contract', () => {
    it('builds default params (limit=50) and applies day boundaries to dates', async () => {
      // Arrange
      httpGet.mockResolvedValueOnce({ data: [] });

      // Act
      await getStockUpdates({
        from: '2025-10-01',
        to: '2025-10-31',
        supplierId: 'SUP-001',
        itemName: 'Widget',
      });

      // Assert
      expect(httpGet).toHaveBeenCalledWith('/api/analytics/stock-updates', {
        params: {
          startDate: '2025-10-01T00:00:00',
          endDate: '2025-10-31T23:59:59',
          supplierId: 'SUP-001',
          itemName: 'Widget',
          limit: 50,
        },
      });
    });

    it('uses provided limit and omits empty optional fields', async () => {
      // Arrange
      httpGet.mockResolvedValueOnce({ data: [] });

      // Act
      await getStockUpdates({
        from: '2025-10-01',
        to: '2025-10-02',
        supplierId: '',
        itemName: '',
        limit: 10,
      });

      // Assert
      expect(httpGet).toHaveBeenCalledWith('/api/analytics/stock-updates', {
        params: {
          startDate: '2025-10-01T00:00:00',
          endDate: '2025-10-02T23:59:59',
          supplierId: undefined,
          itemName: undefined,
          limit: 10,
        },
      });
    });
  });

  describe('response parsing contract', () => {
    it('returns [] when backend data is not an array of records', async () => {
      // Arrange
      httpGet.mockResolvedValueOnce({ data: { nope: true } });

      // Act
      const res = await getStockUpdates({ from: '2025-10-01', to: '2025-10-31' });

      // Assert
      expect(res).toEqual([]);
    });

    it('maps tolerant fields and filters rows missing required identifiers', async () => {
      // Arrange
      httpGet.mockResolvedValueOnce({
        data: [
          { createdAt: '2025-10-01T12:00:00', name: 'Item A', change: '5', note: 'restock', performedBy: 'carlos' },
          { timestamp: '2025-10-02T12:00:00', itemName: 'Item B', delta: -2, reason: 'sale', user: 'system' },
          { itemName: 'No time', delta: 1 },
          { timestamp: '2025-10-03T12:00:00', delta: 1 },
        ],
      });

      // Act
      const res = await getStockUpdates();

      // Assert
      expect(res).toEqual([
        {
          timestamp: '2025-10-01T12:00:00',
          itemName: 'Item A',
          delta: 5,
          reason: 'restock',
          user: 'carlos',
        },
        {
          timestamp: '2025-10-02T12:00:00',
          itemName: 'Item B',
          delta: -2,
          reason: 'sale',
          user: 'system',
        },
      ]);
    });

    it('normalizes empty optional fields to undefined', async () => {
      // Arrange
      httpGet.mockResolvedValueOnce({
        data: [
          { timestamp: '2025-10-01T12:00:00', itemName: 'Item A', delta: 1, reason: '', user: '' },
        ],
      });

      // Act
      const res = await getStockUpdates();

      // Assert
      expect(res).toEqual([
        {
          timestamp: '2025-10-01T12:00:00',
          itemName: 'Item A',
          delta: 1,
          reason: undefined,
          user: undefined,
        },
      ]);
    });
  });

  describe('transport failures', () => {
    it('returns [] when http throws', async () => {
      // Arrange
      httpGet.mockRejectedValueOnce(new Error('network'));

      // Act
      const res = await getStockUpdates({ from: '2025-10-01', to: '2025-10-31' });

      // Assert
      expect(res).toEqual([]);
    });
  });
});
