/**
 * @file itemSearch.search.test.ts
 * @module tests/api/shared/itemSearch.search
 * @description Contract tests for searchItemsGlobal / searchItemsForSupplier /
 * listItemsForSupplier.
 *
 * Contract under test:
 * - Guarantees the shared item-search fetchers query GET
 *   /api/inventory/search with the correct parameters (name, size,
 *   optional supplierId), parse the Spring Page envelope, short-circuit
 *   on blank input, and collapse every failure to an empty list.
 * - listItemsForSupplier loads one page of up to 2,000 items with no name
 *   filter and reports whether that page held every item.
 *
 * Out of scope:
 * - HTTP transport details (headers, auth, interceptors, retries, and
 *   timeouts).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '@/api/httpClient';
import { searchItemsGlobal, searchItemsForSupplier, listItemsForSupplier } from '@/api/shared/itemSearch';

const httpMock = http as unknown as { get: ReturnType<typeof vi.fn> };

describe('itemSearch fetchers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchItemsGlobal', () => {
    it('queries the paginated search endpoint and normalizes the Page content', async () => {
      httpMock.get.mockResolvedValue({
        data: { content: [{ id: 'I-1', name: 'Bolt', supplierId: 'S-1' }], page: { totalElements: 1 } },
      });

      const result = await searchItemsGlobal('bolt', 25);

      expect(httpMock.get).toHaveBeenCalledWith('/api/inventory/search', {
        params: { name: 'bolt', size: 25 },
      });
      expect(result).toEqual([{ id: 'I-1', name: 'Bolt', supplierId: 'S-1' }]);
    });

    it('short-circuits without a request when the query is blank', async () => {
      const result = await searchItemsGlobal('   ');

      expect(httpMock.get).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('returns an empty list on request failure', async () => {
      httpMock.get.mockRejectedValue(new Error('offline'));

      const result = await searchItemsGlobal('bolt');

      expect(result).toEqual([]);
    });

    it('returns an empty list when the response is not a Page envelope', async () => {
      httpMock.get.mockResolvedValue({ data: [{ id: 'I-1', name: 'Bolt' }] });

      const result = await searchItemsGlobal('bolt');

      expect(result).toEqual([]);
    });
  });

  describe('searchItemsForSupplier', () => {
    it('forwards supplierId as a server parameter', async () => {
      httpMock.get.mockResolvedValue({
        data: { content: [{ id: 'I-2', name: 'Nut', supplierId: 'S-2' }] },
      });

      const result = await searchItemsForSupplier('S-2', 'nut', 10);

      expect(httpMock.get).toHaveBeenCalledWith('/api/inventory/search', {
        params: { name: 'nut', size: 10, supplierId: 'S-2' },
      });
      expect(result).toEqual([{ id: 'I-2', name: 'Nut', supplierId: 'S-2' }]);
    });

    it('short-circuits when supplierId is missing', async () => {
      const result = await searchItemsForSupplier('', 'nut');

      expect(httpMock.get).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('listItemsForSupplier', () => {
    it('loads the whole supplier list in one page, without a name filter', async () => {
      httpMock.get.mockResolvedValue({
        data: {
          content: [{ id: 'I-3', name: 'Pallet', sku: 'LOG-PAL-EUR1', supplierId: 'S-4' }],
          page: { size: 2000, number: 0, totalElements: 1, totalPages: 1 },
        },
      });

      const result = await listItemsForSupplier('S-4');

      expect(httpMock.get).toHaveBeenCalledWith('/api/inventory/search', {
        params: { supplierId: 'S-4', size: 2000 },
      });
      expect(result).toEqual({
        items: [{ id: 'I-3', name: 'Pallet', sku: 'LOG-PAL-EUR1', supplierId: 'S-4' }],
        complete: true,
      });
    });

    it('reports an incomplete list when the page holds fewer items than the total', async () => {
      httpMock.get.mockResolvedValue({
        data: { content: [{ id: 'I-1', name: 'Bolt' }], page: { totalElements: 2001 } },
      });

      expect((await listItemsForSupplier('S-1')).complete).toBe(false);
    });

    it('reads a flat totalElements as well', async () => {
      httpMock.get.mockResolvedValue({
        data: { content: [{ id: 'I-1', name: 'Bolt' }], totalElements: 1 },
      });

      expect((await listItemsForSupplier('S-1')).complete).toBe(true);
    });

    it('without a total, a full page counts as incomplete', async () => {
      const full = Array.from({ length: 2000 }, (_, i) => ({ id: `I-${i}`, name: `Item ${i}` }));
      httpMock.get.mockResolvedValueOnce({ data: { content: full } });
      httpMock.get.mockResolvedValueOnce({ data: { content: full.slice(1) } });

      expect((await listItemsForSupplier('S-1')).complete).toBe(false);
      expect((await listItemsForSupplier('S-1')).complete).toBe(true);
    });

    it('reports an empty, incomplete list on failure so callers fall back', async () => {
      httpMock.get.mockRejectedValue(new Error('offline'));

      expect(await listItemsForSupplier('S-1')).toEqual({ items: [], complete: false });
    });
  });
});
