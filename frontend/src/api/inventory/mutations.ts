/**
 * @file mutations.ts
 * @module api/inventory/mutations
 *
 * @summary
 * Inventory mutations: create/update item, adjust quantity, change price,
 * plus tolerant helpers for suppliers and supplier-scoped item search.
 *
 * @enterprise
 * - No `any`: all unknown input is narrowed via type guards.
 * - Network calls are tolerant: functions return safe fallbacks instead of throwing.
 * - Endpoint bases are centralized so backend path changes are single-line edits.
 */

import http from '../httpClient';
import type { InventoryRow } from './types';

/** Centralized endpoint bases (adjust to match your controllers if needed). */
export const INVENTORY_BASE = '/api/inventory';
export const SUPPLIERS_BASE = '/api/suppliers';

/** Small helpers for safe narrowing. */
type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === 'object' && v !== null;

const pickString = (r: UnknownRecord, k: string): string | undefined => {
  const v = r[k];
  return typeof v === 'string' ? v : undefined;
};

const pickNumber = (r: UnknownRecord, k: string): number | undefined => {
  const v = r[k];
  return typeof v === 'number' ? v : undefined;
};

const errorMessage = (e: unknown): string => {
  // Axios-like error shape with response.data.{message|error}
  if (isRecord(e) && isRecord(e.response)) {
    const resp = e.response as UnknownRecord;
    if (isRecord(resp.data)) {
      const d = resp.data as UnknownRecord;
      const msg = pickString(d, 'message') ?? pickString(d, 'error');
      if (msg) return msg;
    }
  }
  if (e instanceof Error) return e.message;
  return 'Request failed';
};

/** Create/Update request shapes (UI → API). */
export interface UpsertItemRequest {
  /** undefined → create, present → update */
  id?: string;
  name: string;
  /** Code/SKU (nullable – DB may not have SKU yet) */
  code?: string | null;
  supplierId: string | number;
  /** Initial quantity for new items */
  quantity: number;
  /** Unit price */
  price: number;
  /** Minimum quantity threshold - will be auto-set to 5 if not provided */
  minQty?: number | null;
  /** Notes/reason for creation */
  notes?: string | null;
  /** Created by user - required for backend validation */
  createdBy?: string;
}

export interface UpsertItemResponse {
  ok: boolean;
  item?: InventoryRow;
  error?: string;
}

/** Stock adjustment (purchase-like delta). */
export interface AdjustQuantityRequest {
  id: string;
  /** Positive = purchase/inbound; negative = correction/outbound. */
  delta: number;
  /** Business reason (server may map to enum). */
  reason: string;
}

/** Price change request. */
export interface ChangePriceRequest {
  id: string;
  /** New unit price. */
  price: number;
}

/** Supplier option for pickers. */
export interface SupplierOptionDTO {
  id: string | number;
  name: string;
}

/** Item option for supplier-scoped type-ahead. */
export interface ItemOptionDTO {
  id: string;
  name: string;
  supplierId?: string | number | null;
}

/**
 * Normalize an unknown server row into an InventoryRow.
 * Returns null if required fields are missing.
 */
function toRow(raw: unknown): InventoryRow | null {
  if (!isRecord(raw)) return null;

  const id =
    pickString(raw, 'id') ??
    pickString(raw, 'itemId') ??
    pickString(raw, 'item_id');

  if (!id) return null;

  const name =
    pickString(raw, 'name') ??
    pickString(raw, 'itemName') ??
    pickString(raw, 'title') ??
    '—';

  const code =
    pickString(raw, 'code') ??
    pickString(raw, 'sku') ??
    pickString(raw, 'itemCode') ??
    null;

  const supplierIdRaw =
    pickString(raw, 'supplierId') ??
    pickString(raw, 'supplier_id');
  const supplierIdNum = pickNumber(raw, 'supplierId');
  const supplierId: string | number | null =
    supplierIdRaw ?? (typeof supplierIdNum === 'number' ? supplierIdNum : null);

  const supplierName =
    pickString(raw, 'supplierName') ??
    pickString(raw, 'supplier') ??
    null;

  const onHand =
    pickNumber(raw, 'onHand') ??
    pickNumber(raw, 'quantity') ??
    pickNumber(raw, 'qty') ??
    0;

  const minQty =
    pickNumber(raw, 'minQty') ??
    pickNumber(raw, 'min_quantity') ??
    null;

  const updatedAt =
    pickString(raw, 'updatedAt') ??
    pickString(raw, 'updated_at') ??
    pickString(raw, 'lastUpdate') ??
    null;

  return {
    id: String(id),
    name,
    code,
    supplierId,
    supplierName,
    onHand,
    minQty,
    updatedAt,
  };
}

/**
 * Create or update an inventory item.
 * @param req - Upsert payload; `id` absent ⇒ create, present ⇒ update.
 */
export async function upsertItem(req: UpsertItemRequest): Promise<UpsertItemResponse> {
  try {
    if (req.id) {
      const res = await http.put(`${INVENTORY_BASE}/${encodeURIComponent(req.id)}`, req);
      const row = toRow(res?.data as unknown);
      return { ok: true, item: row ?? undefined };
    } else {
      const res = await http.post(`${INVENTORY_BASE}`, req);
      const row = toRow(res?.data as unknown);
      return { ok: true, item: row ?? undefined };
    }
  } catch (e: unknown) {
    return { ok: false, error: errorMessage(e) };
  }
}

/**
 * Adjust quantity by delta (purchase/correction style).
 * @enterprise Server commonly exposes: PATCH /{id}/quantity?delta=&reason=
 */
export async function adjustQuantity(req: AdjustQuantityRequest): Promise<boolean> {
  try {
    await http.patch(
      `${INVENTORY_BASE}/${encodeURIComponent(req.id)}/quantity`,
      null,
      { params: { delta: req.delta, reason: req.reason } }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Change item price (new unit price).
 * @enterprise Server commonly exposes: PATCH /{id}/price?price=
 */
export async function changePrice(req: ChangePriceRequest): Promise<boolean> {
  try {
    await http.patch(
      `${INVENTORY_BASE}/${encodeURIComponent(req.id)}/price`,
      null,
      { params: { price: req.price } }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Supplier list for pickers (tolerant).
 * Accepts: raw array OR envelopes { items: [...] } / { content: [...] }.
 */
export async function listSuppliers(): Promise<SupplierOptionDTO[]> {
  try {
    const resData = resDataOrEmpty(await http.get(SUPPLIERS_BASE, { params: { pageSize: 1000 } }));
    const candidates: unknown[] = Array.isArray(resData)
      ? resData
      : extractArray(resData, ['items', 'content']);

    const out: SupplierOptionDTO[] = [];
    for (const entry of candidates) {
      if (!isRecord(entry)) continue;

      const idStr =
        pickString(entry, 'id') ??
        pickString(entry, 'supplierId') ??
        pickString(entry, 'supplier_id');

      const idNum = pickNumber(entry, 'supplierId');
      const id: string | number | null = idStr ?? (typeof idNum === 'number' ? idNum : null);

      const name =
        pickString(entry, 'name') ??
        pickString(entry, 'supplierName') ??
        pickString(entry, 'supplier');

      if (id != null && name) out.push({ id, name });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Supplier-scoped item type-ahead (tolerant).
 * Expects either a raw array or an envelope containing an array.
 */
export async function searchItemsBySupplier(
  supplierId: string | number,
  q: string
): Promise<ItemOptionDTO[]> {
  try {
    const resData = resDataOrEmpty(await http.get(`${INVENTORY_BASE}/search`, { params: { supplierId, q } }));
    const candidates = Array.isArray(resData)
      ? (resData as unknown[])
      : extractArray(resData, ['items', 'content']);

    const out: ItemOptionDTO[] = [];
    for (const entry of candidates) {
      if (!isRecord(entry)) continue;

      const id =
        pickString(entry, 'id') ??
        pickString(entry, 'itemId') ??
        pickString(entry, 'item_id');
      if (!id) continue;

      const name =
        pickString(entry, 'name') ??
        pickString(entry, 'itemName') ??
        '—';

      const sIdStr =
        pickString(entry, 'supplierId') ??
        pickString(entry, 'supplier_id');
      const sIdNum = pickNumber(entry, 'supplierId');

      out.push({
        id,
        name,
        supplierId: sIdStr ?? (typeof sIdNum === 'number' ? sIdNum : supplierId),
      });
    }
    return out;
  } catch {
    return [];
  }
}

/** Extract `response.data` safely, or return an empty object. */
function resDataOrEmpty(resp: unknown): unknown {
  if (isRecord(resp) && 'data' in resp) {
    const r = resp as UnknownRecord;
    return r.data ?? {};
  }
  return {};
}

/**
 * From an unknown response object, try to pull an array out of one of the keys.
 * Falls back to [] if nothing sane is found.
 */
function extractArray(obj: unknown, keys: string[]): unknown[] {
  if (!isRecord(obj)) return [];
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) return v as unknown[];
  }
  return [];
}
