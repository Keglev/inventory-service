/**
 * @file supplierListFetcher.test.ts
 * @module tests/api/suppliers/supplierListFetcher
 *
 * @summary
 * Validates the supplier page fetcher under varied envelope formats and failure scenarios.
 * Confirms query parameter composition, response normalization, total calculation, and error fallbacks.
 *
 * @enterprise
 * - Shields list views from backend drift by asserting tolerant parsing behavior
 * - Guarantees pagination totals remain accurate across envelope styles
 * - Ensures network failures degrade gracefully without crashing consuming grids
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('@/api/suppliers/supplierNormalizers', () => ({
  toSupplierRow: vi.fn(),
}));

vi.mock('@/api/inventory/utils', () => ({
  pickNumber: vi.fn(),
  extractArray: vi.fn(),
}));

import http from '@/api/httpClient';
import { toSupplierRow } from '@/api/suppliers/supplierNormalizers';
import { pickNumber, extractArray } from '@/api/inventory/utils';
import { getSuppliersPage, SUPPLIERS_BASE } from '@/api/suppliers/supplierListFetcher';

const httpMock = http as unknown as { get: ReturnType<typeof vi.fn> };
const toSupplierRowMock = toSupplierRow as ReturnType<typeof vi.fn>;
const pickNumberMock = pickNumber as ReturnType<typeof vi.fn>;
const extractArrayMock = extractArray as ReturnType<typeof vi.fn>;

describe('getSuppliersPage', () => {
  const params = { page: 1, pageSize: 25, q: 'acme', sort: 'name,asc' } as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes rows from array payload and reports length total', async () => {
    const row = { id: 'SUP-1' };
    httpMock.get.mockResolvedValue({ data: [{ id: 'SUP-1' }, { id: 'invalid' }] });
    toSupplierRowMock.mockReturnValueOnce(row).mockReturnValueOnce(null);

    const result = await getSuppliersPage(params);

    expect(httpMock.get).toHaveBeenCalledWith(SUPPLIERS_BASE, {
      params: {
        page: 1,
        pageSize: 25,
        q: 'acme',
        sort: 'name,asc',
      },
    });
    expect(result).toEqual({
      items: [row],
      total: 2,
      page: 1,
      pageSize: 25,
    });
  });

  it('derives totals from envelope fields using pickNumber and extractArray', async () => {
    extractArrayMock.mockReturnValue([{ id: 'SUP-2' }]);
    httpMock.get.mockResolvedValue({
      data: { content: [{ id: 'SUP-2' }], totalElements: 15, total: 99 },
    });
    toSupplierRowMock.mockReturnValue({ id: 'SUP-2' });
    pickNumberMock.mockImplementation((_, key) => {
      if (key === 'totalElements') return 15;
      if (key === 'total') return 99;
      return undefined;
    });

    const result = await getSuppliersPage({ page: 2, pageSize: 10 });

    expect(extractArrayMock).toHaveBeenCalledWith({ content: [{ id: 'SUP-2' }], totalElements: 15, total: 99 }, ['content', 'items', 'results']);
    expect(pickNumberMock).toHaveBeenCalledWith({ content: [{ id: 'SUP-2' }], totalElements: 15, total: 99 }, 'totalElements');
    expect(result.total).toBe(15);
    expect(result.items).toEqual([{ id: 'SUP-2' }]);
  });

  it('returns empty page and logs when request fails', async () => {
    const failure = new Error('offline');
    httpMock.get.mockRejectedValue(failure);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getSuppliersPage({ page: 3, pageSize: 50 });

    expect(errorSpy).toHaveBeenCalledWith('[getSuppliersPage] Error fetching suppliers:', failure);
    expect(result).toEqual({
      items: [],
      total: 0,
      page: 3,
      pageSize: 50,
    });

    errorSpy.mockRestore();
  });
});
