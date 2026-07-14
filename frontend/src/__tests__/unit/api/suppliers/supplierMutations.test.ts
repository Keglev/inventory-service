/**
 * @file supplierMutations.test.ts
 * @module tests/unit/api/suppliers/supplierMutations
 * @description Contract tests for createSupplier / updateSupplier / deleteSupplier.
 *
 * Contract under test:
 * - Guarantees supplier mutation contracts: correct HTTP route wiring,
 *   normalization of successful responses, stable invalid-response
 *   messaging, and — on failure — the structured envelope (status, status
 *   token, fieldErrors) that callers classify from, alongside the message.
 *
 * Out of scope:
 * - HTTP client behavior (interceptors, retries/timeouts, auth headers,
 *   and transport concerns).
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

vi.mock('@/api/shared/errorHandling', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/shared/errorHandling')>();
  return {
    ...actual,
    errorMessage: vi.fn(),
  };
});

/** A rejected Axios-shaped 409 carrying the backend's structured envelope. */
const conflictError = {
  response: {
    status: 409,
    data: {
      error: 'conflict',
      message: 'Supplier already exists',
      timestamp: '2026-07-14T00:00:00Z',
      fieldErrors: { name: 'Supplier already exists' },
    },
  },
};

import http from '@/api/httpClient';
import { toSupplierRow } from '@/api/suppliers/supplierNormalizers';
import { errorMessage } from '../../../../api/shared/errorHandling';
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
      it('degrades a non-object create response to the invalid-response error', async () => {
        httpMock.post.mockResolvedValue('weird');
        toSupplierRowMock.mockReturnValue(null);

        const result = await createSupplier(supplierPayload);

        expect(toSupplierRowMock).toHaveBeenCalledWith({});
        expect(result.error).toBe('Invalid response from server');
      });

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
        expect(result).toEqual({
          success: null,
          error: 'Request denied',
          errorToken: null,
          status: null,
          fieldErrors: null,
        });
      });

      it('carries the structured envelope so callers need not read the message', async () => {
        httpMock.post.mockRejectedValue(conflictError);
        errorMessageMock.mockReturnValue('Supplier already exists');

        const result = await createSupplier(supplierPayload);

        expect(result).toEqual({
          success: null,
          error: 'Supplier already exists',
          errorToken: 'conflict',
          status: 409,
          fieldErrors: { name: 'Supplier already exists' },
        });
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
      it('reports an invalid response when the normalizer yields null', async () => {
        httpMock.put.mockResolvedValue({ data: { id: 'SUP-1' } });
        toSupplierRowMock.mockReturnValue(null);

        const result = await updateSupplier('SUP-1', supplierPayload);

        expect(result).toEqual({ success: null, error: 'Invalid response from server' });
      });

      it('degrades a non-object response to the invalid-response error', async () => {
        httpMock.put.mockResolvedValue('weird');
        toSupplierRowMock.mockReturnValue(null);

        const result = await updateSupplier('SUP-1', supplierPayload);

        expect(toSupplierRowMock).toHaveBeenCalledWith({});
        expect(result).toEqual({ success: null, error: 'Invalid response from server' });
      });

      it('returns error message when update fails', async () => {
        const failure = new Error('conflict');
        httpMock.put.mockRejectedValue(failure);
        errorMessageMock.mockReturnValue('Conflict detected');

        const result = await updateSupplier('SUP-1', supplierPayload);

        expect(errorMessageMock).toHaveBeenCalledWith(failure);
        expect(result).toEqual({
          success: null,
          error: 'Conflict detected',
          errorToken: null,
          status: null,
          fieldErrors: null,
        });
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
        expect(result).toEqual({
          success: false,
          error: 'Supplier has purchases',
          errorToken: null,
          status: null,
          fieldErrors: null,
        });
      });
    });
  });
});
