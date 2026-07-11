/**
 * @file listFetcher.test.ts
 * @module tests/unit/api/inventory/listFetcher
 * @description Contract tests for getInventoryPage.
 *
 * Contract under test:
 * - Guarantees page fetch behavior for the inventory list: request
 *   parameter wiring against GET /api/inventory/search (including
 *   grid-to-entity sort field mapping), Spring Page envelope extraction,
 *   row normalization filtering, and a safe empty-page fallback on
 *   failures.
 *
 * Out of scope:
 * - Row normalization logic (treated as a dependency; its mapping rules
 *   are tested separately).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('../../../../api/inventory/rowNormalizers', () => ({
  toInventoryRow: vi.fn(),
}));

import http from '../../../../api/httpClient';
import { toInventoryRow } from '../../../../api/inventory/rowNormalizers';
import { getInventoryPage } from '../../../../api/inventory/listFetcher';

type HttpGetMock = ReturnType<typeof vi.fn>;

const httpMock = http as unknown as { get: HttpGetMock };
const toInventoryRowMock = toInventoryRow as ReturnType<typeof vi.fn>;

describe('getInventoryPage', () => {
  const params = {
    page: 0,
    pageSize: 25,
    q: undefined,
    supplierId: 'SUP-1',
    sort: 'name,asc',
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success paths', () => {
    it('calls the paginated search endpoint and returns normalized rows with the Page total', async () => {
      const row = { id: 'ITEM-1' };
      httpMock.get.mockResolvedValue({
        data: { content: [{ id: 'ITEM-1' }, { id: 'invalid' }], totalElements: 42 },
      });
      toInventoryRowMock.mockReturnValueOnce(row).mockReturnValueOnce(null);

      const result = await getInventoryPage(params);

      expect(httpMock.get).toHaveBeenCalledWith('/api/inventory/search', {
        params: {
          name: '',
          supplierId: params.supplierId,
          belowMinimumOnly: false,
          page: params.page,
          size: params.pageSize,
          sort: 'name,asc',
        },
      });
      expect(result).toEqual({
        items: [row],
        total: 42,
        page: params.page,
        pageSize: params.pageSize,
      });
    });

    it('maps grid sort fields to backend entity properties', async () => {
      httpMock.get.mockResolvedValue({ data: { content: [], totalElements: 0 } });

      await getInventoryPage({ ...params, sort: 'onHand,desc' });

      expect(httpMock.get).toHaveBeenCalledWith('/api/inventory/search', {
        params: expect.objectContaining({ sort: 'quantity,desc' }),
      });
    });

    it('falls back to name,asc for unknown sort fields', async () => {
      httpMock.get.mockResolvedValue({ data: { content: [], totalElements: 0 } });

      await getInventoryPage({ ...params, sort: 'totalValue,desc' });

      expect(httpMock.get).toHaveBeenCalledWith('/api/inventory/search', {
        params: expect.objectContaining({ sort: 'name,asc' }),
      });
    });

    it('forwards q as name and the belowMinimumOnly flag', async () => {
      httpMock.get.mockResolvedValue({ data: { content: [], totalElements: 0 } });

      await getInventoryPage({ ...params, q: 'bolt', belowMinimumOnly: true });

      expect(httpMock.get).toHaveBeenCalledWith('/api/inventory/search', {
        params: expect.objectContaining({ name: 'bolt', belowMinimumOnly: true }),
      });
    });

    it('yields an empty page when the response is not a Spring Page envelope', async () => {
      httpMock.get.mockResolvedValue({ data: [{ id: 'ITEM-1' }] });

      const result = await getInventoryPage(params);

      expect(result).toEqual({
        items: [],
        total: 0,
        page: params.page,
        pageSize: params.pageSize,
      });
    });
  });

  describe('failure paths', () => {
    it('returns an empty page and logs a diagnostic', async () => {
      const failure = new Error('offline');
      httpMock.get.mockRejectedValue(failure);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getInventoryPage(params);

      expect(errorSpy).toHaveBeenCalledWith('[getInventoryPage] Error fetching inventory:', failure);
      expect(result).toEqual({
        items: [],
        total: 0,
        page: params.page,
        pageSize: params.pageSize,
      });

      errorSpy.mockRestore();
    });
  });
});
