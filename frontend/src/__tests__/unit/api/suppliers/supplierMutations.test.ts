/**
 * @file supplierMutations.test.ts
 * @module tests/api/suppliers/supplierMutations
 *
 * @summary
 * Validates supplier CRUD mutation helpers for success, invalid responses, and error propagation.
 * Ensures HTTP integrations, normalization, and user-facing errors stay consistent across operations.
 *
 * @enterprise
 * - Prevents regressions that could quietly drop supplier data from create/update flows
 * - Guarantees backend failures surface actionable messages for customer support
 * - Confirms deletion logic encodes identifiers correctly and returns boolean status
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
    it('returns normalized supplier on success', async () => {
      const supplierRow = { id: 'SUP-1', name: 'Acme' };
      httpMock.post.mockResolvedValue({ data: { id: 'SUP-1', name: 'Acme' } });
      toSupplierRowMock.mockReturnValue(supplierRow);

      const result = await createSupplier(supplierPayload);

      expect(httpMock.post).toHaveBeenCalledWith(SUPPLIERS_BASE, supplierPayload);
      expect(result).toEqual({ success: supplierRow, error: undefined });
    });

    it('reports invalid response when normalizer yields null', async () => {
      httpMock.post.mockResolvedValue({ data: {} });
      toSupplierRowMock.mockReturnValue(null);

      const result = await createSupplier(supplierPayload);

      expect(result).toEqual({ success: null, error: 'Invalid response from server' });
    });

    it('returns error message when request fails', async () => {
      const failure = new Error('denied');
      httpMock.post.mockRejectedValue(failure);
      errorMessageMock.mockReturnValue('Request denied');

      const result = await createSupplier(supplierPayload);

      expect(errorMessageMock).toHaveBeenCalledWith(failure);
      expect(result).toEqual({ success: null, error: 'Request denied' });
    });
  });

  describe('updateSupplier', () => {
    it('updates supplier and returns normalized row', async () => {
      const supplierRow = { id: 'SUP-1', name: 'Acme Updated' };
      httpMock.put.mockResolvedValue({ data: { id: 'SUP-1', name: 'Acme Updated' } });
      toSupplierRowMock.mockReturnValue(supplierRow);

      const result = await updateSupplier('SUP-1', supplierPayload);

      expect(httpMock.put).toHaveBeenCalledWith(`${SUPPLIERS_BASE}/SUP-1`, supplierPayload);
      expect(result).toEqual({ success: supplierRow, error: undefined });
    });

    it('returns error message when update fails', async () => {
      const failure = new Error('conflict');
      httpMock.put.mockRejectedValue(failure);
      errorMessageMock.mockReturnValue('Conflict detected');

      const result = await updateSupplier('SUP-1', supplierPayload);

      expect(errorMessageMock).toHaveBeenCalledWith(failure);
      expect(result).toEqual({ success: null, error: 'Conflict detected' });
    });
  });

  describe('deleteSupplier', () => {
    it('returns success true when deletion succeeds', async () => {
      httpMock.delete.mockResolvedValue({});

      const result = await deleteSupplier('SUP-1');

      expect(httpMock.delete).toHaveBeenCalledWith(`${SUPPLIERS_BASE}/SUP-1`);
      expect(result).toEqual({ success: true });
    });

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
