/**
 * @file supplierListFetcher.test.ts
 * @module tests/unit/api/suppliers/supplierListFetcher
 * @what_is_under_test getSuppliersPage
 * @responsibility
 * Guarantees supplier list page fetching contracts: query param wiring, tolerant envelope handling,
 * row normalization filtering, total derivation rules, and safe empty-page fallbacks on failures.
 * @out_of_scope
 * HTTP client behavior (interceptors, retries/timeouts, auth headers, and transport concerns).
 * @out_of_scope
 * Supplier row normalization rules (validated by supplier normalizer unit tests).
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

  describe('success paths', () => {
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

    it('prefers totalElements when available and tolerates envelope formats', async () => {
      extractArrayMock.mockReturnValue([{ id: 'SUP-2' }]);
      httpMock.get.mockResolvedValue({
        data: { content: [{ id: 'SUP-2' }], totalElements: 15, total: 99 },
      });
      toSupplierRowMock.mockReturnValue({ id: 'SUP-2' });
      pickNumberMock.mockImplementation((_, key) => (key === 'totalElements' ? 15 : 99));

      const result = await getSuppliersPage({ page: 2, pageSize: 10 });

      expect(result).toEqual({
        items: [{ id: 'SUP-2' }],
        total: 15,
        page: 2,
        pageSize: 10,
      });
    });
  });

  describe('failure paths', () => {
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
});
