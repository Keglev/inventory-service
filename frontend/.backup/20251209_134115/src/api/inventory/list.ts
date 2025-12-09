/**
 * @file list.ts
 * @module api/inventory/list
 *
 * @summary
 * Inventory list fetcher for the grid.
 * Maps the current backend DTO:
 *  - quantity          -> onHand
 *  - minimumQuantity   -> minQty
 *  - createdAt         -> updatedAt
 */

import http from '../httpClient';
import type { InventoryListParams, InventoryListResponse, InventoryRow } from './types';

/* ----------------------------- type guards ------------------------------ */

type UnknownRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === 'object' && v !== null;

const pickString = (r: UnknownRecord, k: string): string | undefined => {
  const v = r[k];
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return undefined;
};

const pickNumber = (r: UnknownRecord, k: string): number | undefined => {
  if (!(k in r)) return undefined;
  const v = r[k];

  if (typeof v === 'number') {
    return Number.isFinite(v) ? v : undefined;
  }

  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

/* ---------------------------- normalization ----------------------------- */

/**
 * Normalize a single raw DTO from GET /api/inventory into InventoryRow.
 * Uses the *exact* keys your backend is sending:
 *  - id, name, code, supplierId, supplierName
 *  - quantity, minimumQuantity, createdAt
 */
function toInventoryRow(raw: unknown): InventoryRow | null {
  if (!isRecord(raw)) return null;

  const id = pickString(raw, 'id');
  if (!id) return null;

  const name = pickString(raw, 'name') ?? '—';
  const code = pickString(raw, 'code') ?? null;

  const supplierIdStr = pickString(raw, 'supplierId');
  const supplierId: string | number | null = supplierIdStr ?? null;

  const supplierName = pickString(raw, 'supplierName') ?? null;

  // quantity -> onHand
  const onHand = pickNumber(raw, 'quantity') ?? 0;

  // minimumQuantity -> minQty
  const minQty = pickNumber(raw, 'minimumQuantity') ?? null;

  // createdAt -> updatedAt (for display)
  const updatedAt = pickString(raw, 'createdAt') ?? null;

  return {
    id,
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
 * Supports:
 *  - plain array: InventoryItemDTO[]
 *  - { items: [...] }
 *  - { content: [...] }
 */
function extractRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!isRecord(data)) return [];

  const items = data['items'];
  const content = data['content'];

  if (Array.isArray(items)) return items;
  if (Array.isArray(content)) return content;

  return [];
}

/* --------------------------------- API ---------------------------------- */

/**
 * Fetch a page of inventory rows from the backend.
 * Works with both:
 *  - plain arrays
 *  - Spring Page–style envelopes
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

    const data: unknown = isRecord(resp) && 'data' in resp
      ? (resp as UnknownRecord).data
      : {};

    const rowsRaw = extractRows(data);

    // total rows
    let total = 0;
    if (Array.isArray(data)) {
      total = data.length;
    } else if (isRecord(data)) {
      const t1 = pickNumber(data, 'total');
      const t2 = pickNumber(data, 'totalElements');
      total = typeof t1 === 'number'
        ? t1
        : (typeof t2 === 'number' ? t2 : rowsRaw.length);
    }

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
    return {
      items: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
}
