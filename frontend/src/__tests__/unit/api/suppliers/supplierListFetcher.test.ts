/**
 * @file supplierListFetcher.test.ts
 * @module tests/unit/api/suppliers/supplierListFetcher
 * @description Contract tests for getSuppliersPage.
 *
 * Contract under test:
 * - Guarantees supplier list page fetching contracts: query param
 *   wiring, tolerant envelope handling, row normalization filtering,
 *   total derivation rules, and safe empty-page fallbacks on failures.
 *
 * Out of scope:
 * - Supplier row normalization rules (validated by supplier normalizer
 *   unit tests).
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

import http from '@/api/httpClient';
import { toSupplierRow } from '@/api/suppliers/supplierNormalizers';
import { getSuppliersPage, searchSuppliersByName, getSupplierById, SUPPLIERS_BASE } from '@/api/suppliers/supplierListFetcher';

const httpMock = http as unknown as { get: ReturnType<typeof vi.fn> };
const toSupplierRowMock = toSupplierRow as ReturnType<typeof vi.fn>;

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

    it('degrades a non-array payload to an empty page', async () => {
      httpMock.get.mockResolvedValue({ data: { unexpected: true } });

      const result = await getSuppliersPage({ page: 0, pageSize: 10 });

      expect(result).toEqual({ items: [], total: 0, page: 0, pageSize: 10 });
    });

    it('degrades a non-object response to an empty page', async () => {
      httpMock.get.mockResolvedValue('weird');

      const result = await getSuppliersPage({ page: 0, pageSize: 10 });

      expect(result).toEqual({ items: [], total: 0, page: 0, pageSize: 10 });
    });
  });

  describe('searchSuppliersByName', () => {
    it('requests the search endpoint and keeps only normalizable rows', async () => {
      const row = { id: 'SUP-1' };
      httpMock.get.mockResolvedValue({ data: [{ id: 'SUP-1' }, { id: 'bad' }] });
      toSupplierRowMock.mockReturnValueOnce(row).mockReturnValueOnce(null);

      const result = await searchSuppliersByName('acme');

      expect(httpMock.get).toHaveBeenCalledWith(`${SUPPLIERS_BASE}/search`, {
        params: { name: 'acme' },
      });
      expect(result).toEqual([row]);
    });

    it('degrades a non-object response to an empty list', async () => {
      httpMock.get.mockResolvedValue('weird');

      await expect(searchSuppliersByName('acme')).resolves.toEqual([]);
    });

    it('returns an empty list and logs on transport failure', async () => {
      const failure = new Error('offline');
      httpMock.get.mockRejectedValue(failure);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(searchSuppliersByName('acme')).resolves.toEqual([]);

      expect(errorSpy).toHaveBeenCalledWith(
        '[searchSuppliersByName] Error searching suppliers by name:',
        failure,
      );
      errorSpy.mockRestore();
    });
  });

  describe('getSupplierById', () => {
    it('requests the id endpoint (encoded) and normalizes the row', async () => {
      const row = { id: 'SUP 1' };
      httpMock.get.mockResolvedValue({ data: { id: 'SUP 1' } });
      toSupplierRowMock.mockReturnValueOnce(row);

      const result = await getSupplierById('SUP 1');

      expect(httpMock.get).toHaveBeenCalledWith(`${SUPPLIERS_BASE}/SUP%201`);
      expect(result).toEqual(row);
    });

    it('passes null into the normalizer for a non-object response', async () => {
      httpMock.get.mockResolvedValue('weird');
      toSupplierRowMock.mockReturnValueOnce(null);

      const result = await getSupplierById('SUP-1');

      expect(toSupplierRowMock).toHaveBeenCalledWith(null);
      expect(result).toBeNull();
    });

    it('returns null and logs on transport failure', async () => {
      const failure = new Error('offline');
      httpMock.get.mockRejectedValue(failure);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(getSupplierById('SUP-1')).resolves.toBeNull();

      expect(errorSpy).toHaveBeenCalledWith(
        '[getSupplierById] Error fetching supplier by id:',
        failure,
      );
      errorSpy.mockRestore();
    });
  });
});
