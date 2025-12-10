/**
 * @file itemMutations.ts
 * @module api/inventory/itemMutations
 *
 * @summary
 * Item lifecycle mutations: create, update, rename, and delete.
 * All operations are tolerant and return typed responses instead of throwing.
 *
 * @enterprise
 * - CRUD operations with consistent response pattern
 * - Tolerant error handling with detailed error messages
 * - Support for create (POST) and update (PUT) patterns
 * - Endpoint base centralized for easy backend path adjustments
 */

import http from '../httpClient';
import { normalizeInventoryRow } from './normalizers';
import type { UpsertItemRequest, UpsertItemResponse } from './types';
import { errorMessage } from './utils';

/** Centralized endpoint base (adjust to match your controller if needed). */
export const INVENTORY_BASE = '/api/inventory';

/**
 * Create or update an inventory item.
 * ID absent in request ⇒ create (POST); ID present ⇒ update (PUT).
 *
 * @param req - Upsert payload with optional id
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
    return { ok: false, error: errorMessage(e) };
  }
}

/**
 * Rename an inventory item (change item name).
 * Only ADMIN users can rename items.
 *
 * @param req - Rename payload with item id and new name
 * @returns Response object with ok status, normalized item, and optional error
 *
 * @note Backend validates that the new name is not a duplicate for the same supplier
 * @note ADMIN-only operation
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
    return { ok: false, error: errorMessage(e) };
  }
}

/**
 * Delete an inventory item by ID.
 * Item can only be deleted if quantity is 0 (no stock remaining).
 * Only ADMIN users can delete items.
 *
 * @param id - Item identifier to delete
 * @param reason - Business reason for deletion (SCRAPPED, DESTROYED, DAMAGED, EXPIRED, LOST, RETURNED_TO_SUPPLIER)
 * @returns Response object with ok status and optional error message
 *
 * @note ADMIN-only operation
 * @note Backend validates that item quantity is 0 before deletion
 * @note Backend may return error: "You still have merchandise in stock"
 *
 * @example
 * ```typescript
 * const result = await deleteItem('ITEM-123', 'EXPIRED');
 * if (!result.ok) {
 *   console.error('Deletion failed:', result.error);
 * }
 * ```
 */
export async function deleteItem(id: string, reason: string): Promise<UpsertItemResponse> {
  try {
    await http.delete(
      `${INVENTORY_BASE}/${encodeURIComponent(id)}`,
      { params: { reason } }
    );
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: errorMessage(e) };
  }
}
