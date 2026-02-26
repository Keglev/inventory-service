/**
 * @file listFetcher.test.ts
 * @module tests/unit/api/inventory/listFetcher
 * @what_is_under_test getInventoryPage
 * @responsibility
 * Guarantees page fetch behavior for the inventory list: request parameter wiring, tolerant
 * response extraction, row normalization filtering, and a safe empty-page fallback on failures.
 * @out_of_scope
 * HTTP transport details (headers, auth, interceptors, retries, and timeouts).
 * @out_of_scope
 * Row normalization logic (treated as a dependency; its mapping rules are tested separately).
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

vi.mock('../../../../api/inventory/utils', () => ({
  pickNumber: vi.fn(),
}));

import http from '../../../../api/httpClient';
import { toInventoryRow } from '../../../../api/inventory/rowNormalizers';
import { pickNumber } from '../../../../api/inventory/utils';
import { getInventoryPage } from '../../../../api/inventory/listFetcher';

type HttpGetMock = ReturnType<typeof vi.fn>;

const httpMock = http as unknown as { get: HttpGetMock };
const toInventoryRowMock = toInventoryRow as ReturnType<typeof vi.fn>;
const pickNumberMock = pickNumber as ReturnType<typeof vi.fn>;

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
    it('returns normalized rows and total when backend responds with an array', async () => {
      const row = { id: 'ITEM-1' };
      httpMock.get.mockResolvedValue({ data: [{ id: 'ITEM-1' }, { id: 'invalid' }] });
      toInventoryRowMock.mockReturnValueOnce(row).mockReturnValueOnce(null);

      const result = await getInventoryPage(params);

      expect(httpMock.get).toHaveBeenCalledWith('/api/inventory', {
        params: {
          page: params.page,
          pageSize: params.pageSize,
          q: '',
          supplierId: params.supplierId,
          sort: params.sort,
        },
      });
      expect(result).toEqual({
        items: [row],
        total: 2,
        page: params.page,
        pageSize: params.pageSize,
      });
    });

    it('uses totalElements field when provided', async () => {
      const row = { id: 'ITEM-1' };
      httpMock.get.mockResolvedValue({ data: { content: [{}], totalElements: 15 } });
      toInventoryRowMock.mockReturnValue(row);
      pickNumberMock.mockImplementation((_, key) => (key === 'totalElements' ? 15 : undefined));

      const result = await getInventoryPage(params);

      expect(result.total).toBe(15);
      expect(result.items).toEqual([row]);
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
