/**
 * @file supplierQueries.test.ts
 * @module tests/unit/api/inventory/supplierQueries
 * @description Contract tests for listSuppliers.
 *
 * Contract under test:
 * - Guarantees supplier query contracts: stable route/param wiring,
 *   tolerant field extraction from heterogeneous payloads, and safe
 *   empty-array fallbacks on failures.
 *
 * Out of scope:
 * - HTTP client behavior (auth, interceptors, retries/timeouts, and
 *   transport concerns).
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
  SUPPLIERS_BASE,
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
          data: [
            { supplierId: 'SUP-1', name: 'Acme' },
            { supplier_id: 'SUP-2', supplier: 'Bravo Co' },
            { supplierId: 3, supplierName: 'Charlie' },
            { supplierId: null, name: 'Invalid' },
          ],
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

});
