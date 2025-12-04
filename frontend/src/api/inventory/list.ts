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
import { normalizeInventoryRow } from './mutations.ts';

/* ----------------------------- type guards ------------------------------ */

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === 'object' && v !== null;

const pickNumber = (r: UnknownRecord, k: string): number | undefined => {
  if (!(k in r)) return undefined;
  const v = r[k];
  if (typeof v === 'number') {
    return Number.isFinite(v) ? v : undefined;
  }
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed.length === 0) return undefined;
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  return undefined;
};

/* ---------------------------- normalization ----------------------------- */

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
    // Normalize response
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
      .map(normalizeInventoryRow)
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
