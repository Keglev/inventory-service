/**
 * @file itemMutations.test.ts
 * @module tests/unit/api/inventory/itemMutations
 * @description Contract tests for createItem / renameItem / deleteItem.
 *
 * Contract under test:
 * - Guarantees the inventory mutation contracts: correct HTTP verb +
 *   route encoding, a bare `{ ok: true }` on success, and stable error
 *   surfaces (via `errorMessage`) on failures.
 *
 * Out of scope:
 * - HTTP client behavior (interceptors, headers, auth, retries, and
 *   transport-layer concerns).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/httpClient', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/api/shared/errorHandling', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/shared/errorHandling')>();
  return {
    ...actual,
    errorMessage: vi.fn(),
  };
});

import http from '@/api/httpClient';
import { errorMessage } from '@/api/shared/errorHandling';
import { createItem, deleteItem, renameItem } from '@/api/inventory/itemMutations';
import { INVENTORY_BASE } from '@/api/shared/constants';

type HttpMock = {
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const httpMock = http as unknown as HttpMock;
const errorMessageMock = errorMessage as ReturnType<typeof vi.fn>;

const baseRequest = {
  name: 'Widget',
  sku: 'SKU-WID-1',
  supplierId: 'SUP-1',
  quantity: 10,
  price: 5,
};

describe('itemMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createItem', () => {
    it('creates an item via POST', async () => {
      httpMock.post.mockResolvedValue({ data: { id: 'ITEM-1' } });

      const result = await createItem({ ...baseRequest });

      expect(httpMock.post).toHaveBeenCalledWith(`${INVENTORY_BASE}`, baseRequest);
      expect(result).toEqual({ ok: true });
    });

    it('returns error details when create fails', async () => {
      const failure = new Error('network');
      httpMock.post.mockRejectedValue(failure);
      errorMessageMock.mockReturnValue('Network offline');

      const result = await createItem({ ...baseRequest });

      expect(errorMessageMock).toHaveBeenCalledWith(failure);
      expect(result).toEqual({
        ok: false, error: 'Network offline', errorToken: null, status: null, fieldErrors: null,
      });
    });

    it('passes the backend fieldErrors map through on failure', async () => {
      const failure = {
        response: {
          status: 400,
          data: {
            error: 'bad_request',
            message: 'sku SKU is mandatory',
            fieldErrors: { sku: 'SKU is mandatory' },
          },
        },
      };
      httpMock.post.mockRejectedValue(failure);
      errorMessageMock.mockReturnValue('Bad request');

      const result = await createItem({ ...baseRequest });

      expect(result).toEqual({
        ok: false, error: 'Bad request', errorToken: 'bad_request', status: 400,
        fieldErrors: { sku: 'SKU is mandatory' },
      });
    });
  });

  describe('renameItem', () => {
    it('renames item via PATCH', async () => {
      httpMock.patch.mockResolvedValue({ data: { id: 'ITEM-1' } });

      const result = await renameItem({ id: 'ITEM 1', newName: 'Renamed' });

      expect(httpMock.patch).toHaveBeenCalledWith(
        `${INVENTORY_BASE}/ITEM%201/name`,
        null,
        { params: { name: 'Renamed' } }
      );
      expect(result).toEqual({ ok: true });
    });

    it('returns error details when rename fails', async () => {
      const failure = new Error('denied');
      httpMock.patch.mockRejectedValue(failure);
      errorMessageMock.mockReturnValue('Forbidden');

      const result = await renameItem({ id: 'ITEM-1', newName: 'Renamed' });

      expect(errorMessageMock).toHaveBeenCalledWith(failure);
      expect(result).toEqual({ ok: false, error: 'Forbidden', errorToken: null, status: null });
    });
  });

  describe('deleteItem', () => {
    it('deletes item with encoded id', async () => {
      httpMock.delete.mockResolvedValue({});

      const result = await deleteItem('ITEM 1');

      expect(httpMock.delete).toHaveBeenCalledWith(`${INVENTORY_BASE}/ITEM%201`);
      expect(result).toEqual({ ok: true });
    });

    it('returns error details when delete fails', async () => {
      const failure = new Error('in-stock');
      httpMock.delete.mockRejectedValue(failure);
      errorMessageMock.mockReturnValue('Cannot delete');

      const result = await deleteItem('ITEM-1');

      expect(errorMessageMock).toHaveBeenCalledWith(failure);
      expect(result).toEqual({ ok: false, error: 'Cannot delete', errorToken: null, status: null });
    });
  });
});
