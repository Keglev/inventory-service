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

  it('returns normalized rows and total when backend responds with array', async () => {
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
    pickNumberMock.mockImplementation((_, key) => {
      return key === 'totalElements' ? 15 : undefined;
    });

    const result = await getInventoryPage(params);

    expect(result.total).toBe(15);
    expect(result.items).toEqual([row]);
  });

  it('returns empty page on failure', async () => {
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
