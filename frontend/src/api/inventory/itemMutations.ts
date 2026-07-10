/**
 * @module api/inventory/itemMutations
 *
 * Item lifecycle mutations (create, update, rename, delete) for the inventory API.
 * Uses POST /api/inventory to create, PUT /api/inventory/{id} to update,
 * PATCH /api/inventory/{id}/name to rename, and DELETE /api/inventory/{id} to remove.
 * All functions return typed response objects rather than throwing.
 */

import http from '../httpClient';
import { normalizeInventoryRow } from './normalizers';
import type { UpsertItemRequest, UpsertItemResponse } from './types';
import { errorMessage, extractApiError } from '../shared/errorHandling';
import { INVENTORY_BASE } from '../shared/constants';

export { INVENTORY_BASE };

/**
 * Collapses POST (create) and PUT (update) into one call — presence of `id` selects the verb.
 * Hits POST /api/inventory when `id` is absent, PUT /api/inventory/{id} when present.
 *
 * @param req - Upsert payload; omit `id` for create, include it for update
 * @returns Response object with ok status, normalized item, and optional error
 *
 * @example
 * ```typescript
 * // Create new item
 * const result = await upsertItem({
 *   name: 'Widget A',
 *   supplierId: 'SUP-001',
 *   quantity: 100,
 *   price: 25.50
 * });
 *
 * // Update existing item
 * const updateResult = await upsertItem({
 *   id: 'ITEM-123',
 *   name: 'Widget A v2',
 *   supplierId: 'SUP-001',
 *   quantity: 50,
 *   price: 27.00
 * });
 * ```
 */
export async function upsertItem(req: UpsertItemRequest): Promise<UpsertItemResponse> {
  try {
    if (req.id) {
      const res = await http.put(`${INVENTORY_BASE}/${encodeURIComponent(req.id)}`, req);
      const row = normalizeInventoryRow(res?.data as unknown);
      return { ok: true, item: row ?? undefined };
    } else {
      const res = await http.post(`${INVENTORY_BASE}`, req);
      const row = normalizeInventoryRow(res?.data as unknown);
      return { ok: true, item: row ?? undefined };
    }
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
export async function renameItem(req: { id: string; newName: string }): Promise<UpsertItemResponse> {
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
export async function deleteItem(id: string): Promise<UpsertItemResponse> {
  try {
    await http.delete(`${INVENTORY_BASE}/${encodeURIComponent(id)}`);
    return { ok: true };
  } catch (e: unknown) {
    const apiError = extractApiError(e);
    return { ok: false, error: errorMessage(e), errorToken: apiError.token, status: apiError.status };
  }
}
