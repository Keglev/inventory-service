/**
 * @file supplierListFetcher.test.ts
 * @module tests/unit/api/suppliers/supplierListFetcher
 * @description Contract tests for the supplier list and search fetchers.
 *
 * Contract under test:
 * - getAllSuppliers requests the list without parameters (the endpoint takes
 *   none), keeps only normalizable rows, and falls back to [] on failures or
 *   an unexpected payload.
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
import { getAllSuppliers, searchSuppliersByName, SUPPLIERS_BASE } from '@/api/suppliers/supplierListFetcher';

const httpMock = http as unknown as { get: ReturnType<typeof vi.fn> };
const toSupplierRowMock = toSupplierRow as ReturnType<typeof vi.fn>;

describe('getAllSuppliers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success paths', () => {
    it('requests the list without parameters and keeps only normalizable rows', async () => {
      const row = { id: 'SUP-1' };
      httpMock.get.mockResolvedValue({ data: [{ id: 'SUP-1' }, { id: 'invalid' }] });
      toSupplierRowMock.mockReturnValueOnce(row).mockReturnValueOnce(null);

      const result = await getAllSuppliers();

      // The endpoint ignores every parameter; sending page or sort only made
      // the grid believe the server paged and sorted (it does not).
      expect(httpMock.get).toHaveBeenCalledWith(SUPPLIERS_BASE);
      expect(result).toEqual([row]);
    });

  });

  describe('failure paths', () => {
    it('returns an empty list and logs when the request fails', async () => {
      const failure = new Error('offline');
      httpMock.get.mockRejectedValue(failure);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getAllSuppliers();

      expect(errorSpy).toHaveBeenCalledWith('[getAllSuppliers] Error fetching suppliers:', failure);
      expect(result).toEqual([]);

      errorSpy.mockRestore();
    });

    it('degrades a non-array payload to an empty list', async () => {
      httpMock.get.mockResolvedValue({ data: { unexpected: true } });

      expect(await getAllSuppliers()).toEqual([]);
    });

    it('degrades a non-object response to an empty list', async () => {
      httpMock.get.mockResolvedValue('weird');

      expect(await getAllSuppliers()).toEqual([]);
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
});
