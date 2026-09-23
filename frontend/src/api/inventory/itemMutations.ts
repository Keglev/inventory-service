/**
 * @module api/inventory/itemMutations
 *
 * Item lifecycle mutations (create, rename, delete) for the inventory API.
 * Uses POST /api/inventory to create, PATCH /api/inventory/{id}/name to rename,
 * and DELETE /api/inventory/{id} to remove.
 * All functions return typed response objects rather than throwing.
 */

import http from '../httpClient';
import { normalizeInventoryRow } from './normalizers';
import type { CreateItemRequest, ItemWriteResult } from './types';
import { errorMessage, extractApiError } from '../shared/errorHandling';
import { INVENTORY_BASE } from '../shared/constants';

export { INVENTORY_BASE };

/**
 * Creates an item via POST /api/inventory. Existing items are changed only
 * through the dedicated rename, price and quantity mutations, so the
 * client has no full-update call.
 *
 * @param req - Create payload
 * @returns Response object with ok status, normalized item, and optional error
 *
 * @example
 * ```typescript
 * const result = await createItem({
 *   name: 'Widget A',
 *   sku: 'WID-A',
 *   supplierId: 'SUP-001',
 *   quantity: 100,
 *   price: 25.50
 * });
 * ```
 */
export async function createItem(req: CreateItemRequest): Promise<ItemWriteResult> {
  try {
    const res = await http.post(`${INVENTORY_BASE}`, req);
    const row = normalizeInventoryRow(res?.data as unknown);
    return { ok: true, item: row ?? undefined };
  } catch (e: unknown) {
    const apiError = extractApiError(e);
    return {
      ok: false,
      error: errorMessage(e),
      errorToken: apiError.token,
      status: apiError.status,
      fieldErrors: apiError.fieldErrors,
    };
  }
}

/**
 * Patches the item name via PATCH /api/inventory/{id}/name rather than going through
 * the full PUT update, so the backend can enforce per-field authorization.
 * Sends the new name as a query param (not a body), matching the backend endpoint contract.
 *
 * @param req - Rename payload with item id and new name
 * @returns Response object with ok status, normalized item, and optional error
 *
 * @example
 * ```typescript
 * const result = await renameItem({
 *   id: 'ITEM-123',
 *   newName: 'Updated Widget Name'
 * });
 * ```
 */
export async function renameItem(req: { id: string; newName: string }): Promise<ItemWriteResult> {
  try {
    const res = await http.patch(
      `${INVENTORY_BASE}/${encodeURIComponent(req.id)}/name`,
      null,
      { params: { name: req.newName } }
    );
    const row = normalizeInventoryRow(res?.data as unknown);
    return { ok: true, item: row ?? undefined };
  } catch (e: unknown) {
    const apiError = extractApiError(e);
    return { ok: false, error: errorMessage(e), errorToken: apiError.token, status: apiError.status };
  }
}

/**
 * Sends DELETE /api/inventory/{id}. Deletion is a pure catalog removal: the
 * backend only accepts it once the item's quantity is zero (409 'conflict'
 * otherwise) and writes no stock-history row for the deletion itself.
 *
 * @param id - Item identifier to delete
 * @returns Response object with ok status and optional error message
 *
 * @example
 * ```typescript
 * const result = await deleteItem('ITEM-123');
 * if (!result.ok) {
 *   console.error('Deletion failed:', result.error);
 * }
 * ```
 */
export async function deleteItem(id: string): Promise<ItemWriteResult> {
  try {
    await http.delete(`${INVENTORY_BASE}/${encodeURIComponent(id)}`);
    return { ok: true };
  } catch (e: unknown) {
    const apiError = extractApiError(e);
    return { ok: false, error: errorMessage(e), errorToken: apiError.token, status: apiError.status };
  }
}
