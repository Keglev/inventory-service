/**
 * @file supplierMutations.test.ts
 * @module tests/unit/api/suppliers/supplierMutations
 * @what_is_under_test createSupplier / updateSupplier / deleteSupplier
 * @responsibility
 * Guarantees supplier mutation contracts: correct HTTP route wiring, normalization of successful
 * responses, stable invalid-response messaging, and user-facing error surfaces via `errorMessage`.
 * @out_of_scope
 * Supplier normalizer implementation details (treated as a dependency; validated in its own unit tests).
 * @out_of_scope
 * HTTP client behavior (interceptors, retries/timeouts, auth headers, and transport concerns).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/httpClient', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/api/suppliers/supplierNormalizers', () => ({
  toSupplierRow: vi.fn(),
}));

vi.mock('@/api/inventory/utils', () => ({
  errorMessage: vi.fn(),
}));

import http from '@/api/httpClient';
import { toSupplierRow } from '@/api/suppliers/supplierNormalizers';
import { errorMessage } from '@/api/inventory/utils';
import { SUPPLIERS_BASE } from '@/api/suppliers/supplierListFetcher';
import {
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '@/api/suppliers/supplierMutations';

const httpMock = http as unknown as {
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};
const toSupplierRowMock = toSupplierRow as ReturnType<typeof vi.fn>;
const errorMessageMock = errorMessage as ReturnType<typeof vi.fn>;

const supplierPayload = { name: 'Acme' };

describe('supplierMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSupplier', () => {
    describe('success paths', () => {
      it('returns normalized supplier on success', async () => {
        const supplierRow = { id: 'SUP-1', name: 'Acme' };
        httpMock.post.mockResolvedValue({ data: { id: 'SUP-1', name: 'Acme' } });
        toSupplierRowMock.mockReturnValue(supplierRow);

        const result = await createSupplier(supplierPayload);

        expect(httpMock.post).toHaveBeenCalledWith(SUPPLIERS_BASE, supplierPayload);
        expect(result).toEqual({ success: supplierRow, error: undefined });
      });
    });

    describe('invalid response', () => {
      it('reports an invalid response when the normalizer yields null', async () => {
        httpMock.post.mockResolvedValue({ data: {} });
        toSupplierRowMock.mockReturnValue(null);

        const result = await createSupplier(supplierPayload);

        expect(result).toEqual({ success: null, error: 'Invalid response from server' });
      });
    });

    describe('failure paths', () => {
      it('returns error message when request fails', async () => {
        const failure = new Error('denied');
        httpMock.post.mockRejectedValue(failure);
        errorMessageMock.mockReturnValue('Request denied');

        const result = await createSupplier(supplierPayload);

        expect(errorMessageMock).toHaveBeenCalledWith(failure);
        expect(result).toEqual({ success: null, error: 'Request denied' });
      });
    });
  });

  describe('updateSupplier', () => {
    describe('success paths', () => {
      it('updates supplier and returns normalized row', async () => {
        const supplierRow = { id: 'SUP-1', name: 'Acme Updated' };
        httpMock.put.mockResolvedValue({ data: { id: 'SUP-1', name: 'Acme Updated' } });
        toSupplierRowMock.mockReturnValue(supplierRow);

        const result = await updateSupplier('SUP-1', supplierPayload);

        expect(httpMock.put).toHaveBeenCalledWith(`${SUPPLIERS_BASE}/SUP-1`, supplierPayload);
        expect(result).toEqual({ success: supplierRow, error: undefined });
      });
    });

    describe('failure paths', () => {
      it('returns error message when update fails', async () => {
        const failure = new Error('conflict');
        httpMock.put.mockRejectedValue(failure);
        errorMessageMock.mockReturnValue('Conflict detected');

        const result = await updateSupplier('SUP-1', supplierPayload);

        expect(errorMessageMock).toHaveBeenCalledWith(failure);
        expect(result).toEqual({ success: null, error: 'Conflict detected' });
      });
    });
  });

  describe('deleteSupplier', () => {
    describe('success paths', () => {
      it('returns success true when deletion succeeds', async () => {
        httpMock.delete.mockResolvedValue({});

        const result = await deleteSupplier('SUP-1');

        expect(httpMock.delete).toHaveBeenCalledWith(`${SUPPLIERS_BASE}/SUP-1`);
        expect(result).toEqual({ success: true });
      });
    });

    describe('failure paths', () => {
      it('propagates error message when deletion fails', async () => {
        const failure = new Error('in-use');
        httpMock.delete.mockRejectedValue(failure);
        errorMessageMock.mockReturnValue('Supplier has purchases');

        const result = await deleteSupplier('SUP-1');

        expect(errorMessageMock).toHaveBeenCalledWith(failure);
        expect(result).toEqual({ success: false, error: 'Supplier has purchases' });
      });
    });
  });
});
