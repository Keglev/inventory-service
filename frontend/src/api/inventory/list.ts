/**
 * @file list.ts
 * @module api/inventory/list
 *
 * @summary
 * Server-driven inventory list fetcher with strict typing:
 * - No `any`: unknown inputs are narrowed via type guards.
 * - Tolerant to envelope/field variations (e.g., Spring Page vs custom).
 * - Never throws; returns an empty, valid page on error.
 *
 * @enterprise
 * Keep normalization here so the rest of the app can rely on stable shapes.
 */

import http from '../httpClient';
import type { InventoryListParams, InventoryListResponse } from './types';
import type { InventoryRow } from './types';

/* ----------------------------- type guards ------------------------------ */

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

/* ---------------------------- normalization ----------------------------- */

/**
 * Normalize a single raw row (unknown shape) into InventoryRow.
 * Returns null if required fields are missing.
 */
function toInventoryRow(raw: unknown): InventoryRow | null {
  if (!isRecord(raw)) return null;

  const idStr =
    pickString(raw, 'id') ??
    pickString(raw, 'itemId') ??
    pickString(raw, 'item_id');

  if (!idStr) return null;

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

  const supplierIdStr =
    pickString(raw, 'supplierId') ??
    pickString(raw, 'supplier_id');
  const supplierIdNum = pickNumber(raw, 'supplierId');
  const supplierId: string | number | null =
    supplierIdStr ?? (typeof supplierIdNum === 'number' ? supplierIdNum : null);

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
    pickNumber(raw, 'minimumQuantity') ??
    null;

  const updatedAt =
    pickString(raw, 'updatedAt') ??
    pickString(raw, 'updated_at') ??
    pickString(raw, 'lastUpdate') ??
    null;

  return {
    id: String(idStr),
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
 * Extract an array of rows from various envelope styles.
 * Supports: { items: [...] }, { content: [...] }, or raw array result.
 */
function extractRowsContainer(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!isRecord(data)) return [];
  const items = (data as UnknownRecord)['items'];
  const content = (data as UnknownRecord)['content'];
  if (Array.isArray(items)) return items;
  if (Array.isArray(content)) return content;
  return [];
}

/* --------------------------------- API ---------------------------------- */

/**
 * Fetch a page of inventory rows from the backend.
 *
 * @param params - Pagination, filtering, and sort parameters (1-based page).
 * @returns A normalized list response. On error, returns an empty page.
 */
export async function getInventoryPage(
  params: InventoryListParams
): Promise<InventoryListResponse> {
  try {
    const { page, pageSize, q, supplierId, sort } = params;

    const resp = await http.get('/api/inventory', {
      params: {
        page,
        pageSize,
        q: q ?? '',
        supplierId,
        sort,
      },
    });

    const data = isRecord(resp) && 'data' in resp ? (resp as UnknownRecord).data : {};
    const rowsRaw = extractRowsContainer(data);

    // Ensure `total` is strictly a number (avoid `boolean | number` from && short-circuiting)
    let total = 0;
    if (isRecord(data)) {
      const t1 = pickNumber(data, 'total');
      const t2 = pickNumber(data, 'totalElements');
      total = (typeof t1 === 'number' ? t1 : (typeof t2 === 'number' ? t2 : 0));
    }
    // Normalize rows, filtering out any that fail to parse
    const items: InventoryRow[] = rowsRaw
      .map(toInventoryRow)
      .filter((r): r is InventoryRow => r !== null);

    return {
      items,
      total,
      page,
      pageSize,
    };
  } catch {
    // Never throw; return an empty, valid page.
    return {
      items: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
}
