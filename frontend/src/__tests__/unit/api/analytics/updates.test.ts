/**
 * @file updates.test.ts
 * @module __tests__/unit/api/analytics/updates
 *
 * @summary
 * Test suite for analytics update handling utility functions.
 * Tests data refresh, synchronization, and update processing.
 *
 * @what_is_under_test Update handling functions - refresh logic, sync status, cache management
 * @responsibility Track update timestamps, manage refresh cycles, handle data synchronization
 * @out_of_scope Real-time streaming, push notifications, change detection
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

  it('builds default params (limit=50) and adds day boundaries to dates', async () => {
    httpGet.mockResolvedValueOnce({ data: [] });

    await getStockUpdates({
      from: '2025-10-01',
      to: '2025-10-31',
      supplierId: 'SUP-001',
      itemName: 'Widget',
    });

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
    httpGet.mockResolvedValueOnce({ data: [] });

    await getStockUpdates({
      from: '2025-10-01',
      to: '2025-10-02',
      supplierId: '',
      itemName: '',
      limit: 10,
    });

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

  it('returns [] when backend data is not an array of records', async () => {
    httpGet.mockResolvedValueOnce({ data: { nope: true } });

    const res = await getStockUpdates({ from: '2025-10-01', to: '2025-10-31' });
    expect(res).toEqual([]);
  });

  it('maps tolerant fields and filters rows missing timestamp or itemName', async () => {
    httpGet.mockResolvedValueOnce({
      data: [
        // good, uses tolerant keys: createdAt + name + change + note + performedBy
        { createdAt: '2025-10-01T12:00:00', name: 'Item A', change: '5', note: 'restock', performedBy: 'carlos' },

        // good, uses timestamp + itemName + delta + reason + user
        { timestamp: '2025-10-02T12:00:00', itemName: 'Item B', delta: -2, reason: 'sale', user: 'system' },

        // filtered: missing timestamp
        { itemName: 'No time', delta: 1 },

        // filtered: missing itemName/name
        { timestamp: '2025-10-03T12:00:00', delta: 1 },
      ],
    });

    const res = await getStockUpdates();

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

  it('sets optional fields to undefined when empty', async () => {
    httpGet.mockResolvedValueOnce({
      data: [
        { timestamp: '2025-10-01T12:00:00', itemName: 'Item A', delta: 1, reason: '', user: '' },
      ],
    });

    const res = await getStockUpdates();

    expect(res).toEqual([
      { timestamp: '2025-10-01T12:00:00', itemName: 'Item A', delta: 1, reason: undefined, user: undefined },
    ]);
  });

  it('returns [] when http throws', async () => {
    httpGet.mockRejectedValueOnce(new Error('network'));

    const res = await getStockUpdates({ from: '2025-10-01', to: '2025-10-31' });
    expect(res).toEqual([]);
  });
});
