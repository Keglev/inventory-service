import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../api/httpClient', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../../api/inventory/normalizers', () => ({
  normalizeInventoryRow: vi.fn(),
}));

vi.mock('../../../../api/inventory/utils', () => ({
  errorMessage: vi.fn(),
}));

import http from '../../../../api/httpClient';
import { normalizeInventoryRow } from '../../../../api/inventory/normalizers';
import { errorMessage } from '../../../../api/inventory/utils';
import { deleteItem, INVENTORY_BASE, renameItem, upsertItem } from '../../../../api/inventory/itemMutations';
import type { InventoryRow } from '../../../../api/inventory/types';

type HttpMock = {
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const httpMock = http as unknown as HttpMock;
const normalizeMock = normalizeInventoryRow as ReturnType<typeof vi.fn>;
const errorMessageMock = errorMessage as ReturnType<typeof vi.fn>;

const buildRow = (overrides: Partial<InventoryRow> = {}): InventoryRow => ({
  id: 'ITEM-1',
  name: 'Widget',
  onHand: 0,
  code: null,
  supplierId: null,
  supplierName: null,
  minQty: null,
  updatedAt: null,
  ...overrides,
});

const baseRequest = {
  name: 'Widget',
  supplierId: 'SUP-1',
  quantity: 10,
  price: 5,
};

describe('itemMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('upsertItem', () => {
    it('creates a new item when id is missing', async () => {
      const dto = { id: 'ITEM-1' };
      const row = buildRow();
      httpMock.post.mockResolvedValue({ data: dto });
      normalizeMock.mockReturnValue(row);

      const result = await upsertItem({ ...baseRequest });

      expect(httpMock.post).toHaveBeenCalledWith(`${INVENTORY_BASE}`, baseRequest);
      expect(result).toEqual({ ok: true, item: row });
    });

    it('updates an item when id is present', async () => {
      const dto = { id: 'ITEM-1' };
      const row = buildRow();
      httpMock.put.mockResolvedValue({ data: dto });
      normalizeMock.mockReturnValue(row);

      const result = await upsertItem({ id: 'ITEM-1', ...baseRequest });

      expect(httpMock.put).toHaveBeenCalledWith(`${INVENTORY_BASE}/ITEM-1`, { id: 'ITEM-1', ...baseRequest });
      expect(result).toEqual({ ok: true, item: row });
    });

    it('returns error details when upsert fails', async () => {
      const failure = new Error('network');
      httpMock.post.mockRejectedValue(failure);
      errorMessageMock.mockReturnValue('Network offline');

      const result = await upsertItem({ ...baseRequest });

      expect(errorMessageMock).toHaveBeenCalledWith(failure);
      expect(result).toEqual({ ok: false, error: 'Network offline' });
    });
  });

  describe('renameItem', () => {
    it('renames item via PATCH', async () => {
      const dto = { id: 'ITEM-1' };
      const row = buildRow({ name: 'Renamed' });
      httpMock.patch.mockResolvedValue({ data: dto });
      normalizeMock.mockReturnValue(row);

      const result = await renameItem({ id: 'ITEM 1', newName: 'Renamed' });

      expect(httpMock.patch).toHaveBeenCalledWith(
        `${INVENTORY_BASE}/ITEM%201/name`,
        null,
        { params: { name: 'Renamed' } }
      );
      expect(result).toEqual({ ok: true, item: row });
    });

    it('returns error details when rename fails', async () => {
      const failure = new Error('denied');
      httpMock.patch.mockRejectedValue(failure);
      errorMessageMock.mockReturnValue('Forbidden');

      const result = await renameItem({ id: 'ITEM-1', newName: 'Renamed' });

      expect(errorMessageMock).toHaveBeenCalledWith(failure);
      expect(result).toEqual({ ok: false, error: 'Forbidden' });
    });
  });

  describe('deleteItem', () => {
    it('deletes item with encoded id', async () => {
      httpMock.delete.mockResolvedValue({});

      const result = await deleteItem('ITEM 1', 'EXPIRED');

      expect(httpMock.delete).toHaveBeenCalledWith(
        `${INVENTORY_BASE}/ITEM%201`,
        { params: { reason: 'EXPIRED' } }
      );
      expect(result).toEqual({ ok: true });
    });

    it('returns error details when delete fails', async () => {
      const failure = new Error('in-stock');
      httpMock.delete.mockRejectedValue(failure);
      errorMessageMock.mockReturnValue('Cannot delete');

      const result = await deleteItem('ITEM-1', 'EXPIRED');

      expect(errorMessageMock).toHaveBeenCalledWith(failure);
      expect(result).toEqual({ ok: false, error: 'Cannot delete' });
    });
  });
});
