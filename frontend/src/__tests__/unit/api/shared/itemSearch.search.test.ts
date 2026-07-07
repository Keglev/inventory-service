/**
 * @file itemSearch.search.test.ts
 * @module tests/unit/api/shared/itemSearch.search
 * @what_is_under_test searchItemsGlobal / searchItemsForSupplier
 * @responsibility
 * Guarantees the shared item-search fetchers query GET /api/inventory/search with the
 * correct parameters (name, size, optional supplierId), parse the Spring Page envelope,
 * short-circuit on blank input, and collapse every failure to an empty list.
 * @out_of_scope
 * normalizeItemsList field mapping rules (covered by its own test file).
 * @out_of_scope
 * HTTP transport details (headers, auth, interceptors, retries, and timeouts).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '@/api/httpClient';
import { searchItemsGlobal, searchItemsForSupplier } from '@/api/shared/itemSearch';

const httpMock = http as unknown as { get: ReturnType<typeof vi.fn> };

describe('itemSearch fetchers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchItemsGlobal', () => {
    it('queries the paginated search endpoint and normalizes the Page content', async () => {
      httpMock.get.mockResolvedValue({
        data: { content: [{ id: 'I-1', name: 'Bolt', supplierId: 'S-1' }], totalElements: 1 },
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
});
