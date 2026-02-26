/**
 * @file supplierQueries.test.ts
 * @module tests/unit/api/inventory/supplierQueries
 * @what_is_under_test listSuppliers / searchItemsBySupplier
 * @responsibility
 * Guarantees supplier query contracts: stable route/param wiring, tolerant field extraction
 * from heterogeneous payloads, and safe empty-array fallbacks on failures.
 * @out_of_scope
 * Backend query correctness (ranking, filtering, and data quality are server responsibilities).
 * @out_of_scope
 * HTTP client behavior (auth, interceptors, retries/timeouts, and transport concerns).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

import http from '../../../../api/httpClient';
import {
  listSuppliers,
  searchItemsBySupplier,
  SUPPLIERS_BASE,
  INVENTORY_BASE,
} from '../../../../api/inventory/supplierQueries';

type HttpMock = {
  get: ReturnType<typeof vi.fn>;
};

const httpMock = http as unknown as HttpMock;

describe('supplierQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listSuppliers', () => {
    describe('success paths', () => {
      it('returns normalized supplier entries from varied payloads', async () => {
        httpMock.get.mockResolvedValue({
          data: {
            items: [
              { supplierId: 'SUP-1', name: 'Acme' },
              { supplier_id: 'SUP-2', supplier: 'Bravo Co' },
              { supplierId: 3, supplierName: 'Charlie' },
              { supplierId: null, name: 'Invalid' },
            ],
          },
        });

        const result = await listSuppliers();

        expect(httpMock.get).toHaveBeenCalledWith(SUPPLIERS_BASE, { params: { pageSize: 1000 } });
        expect(result).toEqual([
          { id: 'SUP-1', name: 'Acme' },
          { id: 'SUP-2', name: 'Bravo Co' },
          { id: 3, name: 'Charlie' },
        ]);
      });
    });

    describe('failure paths', () => {
      it('returns empty array when request fails', async () => {
        httpMock.get.mockRejectedValue(new Error('offline'));

        const result = await listSuppliers();

        expect(result).toEqual([]);
      });
    });
  });

  describe('searchItemsBySupplier', () => {
    describe('success paths', () => {
      it('maps search results with tolerant field handling', async () => {
        httpMock.get.mockResolvedValue({
          data: {
            content: [
              { id: 'ITEM-1', name: 'Widget', supplierId: 'SUP-1' },
              { itemId: 'ITEM-2', itemName: 'Gadget', supplier_id: 'SUP-2' },
              { id: 'ITEM-3' },
            ],
          },
        });

        const result = await searchItemsBySupplier('SUP-DEFAULT', 'bolt');

        expect(httpMock.get).toHaveBeenCalledWith(`${INVENTORY_BASE}/search`, {
          params: { supplierId: 'SUP-DEFAULT', q: 'bolt' },
        });
        expect(result).toEqual([
          { id: 'ITEM-1', name: 'Widget', supplierId: 'SUP-1' },
          { id: 'ITEM-2', name: 'Gadget', supplierId: 'SUP-2' },
          { id: 'ITEM-3', name: '—', supplierId: 'SUP-DEFAULT' },
        ]);
      });
    });

    describe('failure paths', () => {
      it('returns empty array when search call fails', async () => {
        httpMock.get.mockRejectedValue(new Error('server down'));

        const result = await searchItemsBySupplier('SUP-1', 'gear');

        expect(result).toEqual([]);
      });
    });
  });
});
