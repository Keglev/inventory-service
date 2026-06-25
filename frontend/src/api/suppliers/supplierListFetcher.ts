/**
 * @file supplierListFetcher.ts
 * @module api/suppliers/supplierListFetcher
 *
 * @summary
 * Fetches the supplier list from GET /api/suppliers and normalizes each raw DTO into a SupplierRow.
 *
 * @enterprise
 * - Backend returns a plain JSON array (List<SupplierDTO>) — no Spring Page envelope, no server-side pagination.
 * - page/pageSize/q/sort are forwarded as query params but are not processed server-side.
 * - extractArray and pickNumber are borrowed from api/inventory/utils — not supplier-owned helpers.
 * - On network failure the fetcher returns an empty page so the UI degrades cleanly rather than throwing.
 */

import http from '../httpClient';
import type { SupplierListParams, SupplierListResponse, SupplierRow } from './types';
import { toSupplierRow } from './supplierNormalizers';
import { pickNumber, extractArray } from '../inventory/utils';

/** Centralized endpoint base. */
export const SUPPLIERS_BASE = '/api/suppliers';

/**
 * Extracts the raw DTO array from the GET /api/suppliers response body.
 *
 * @param data - Response body from GET /api/suppliers; expected to be a bare JSON array.
 * @returns Array of raw DTO objects to normalize
 *
 * @backend GET /api/suppliers returns a plain array — the `Array.isArray` branch is the only live path.
 * @note The `content` / `items` / `results` object-key fallbacks via extractArray are defensive dead code
 *   for the current backend; retained in case the endpoint shape ever changes.
 *
 * @example
 * ```typescript
 * const rows = extractSupplierRows(response.data);
 * ```
 */
const extractSupplierRows = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data;
  if (typeof data !== 'object' || data === null) return [];

  return extractArray(data, ['content', 'items', 'results']); // BUCKET: object-key paths unreachable; backend returns a plain array only (B#1)
};

/**
 * Fetches suppliers from GET /api/suppliers and returns a SupplierListResponse envelope.
 *
 * @param params - page/pageSize/sort/q forwarded as query params; backend does not page server-side.
 * @returns Normalized supplier list, or an empty page on network error
 *
 * @backend GET /api/suppliers → plain List<SupplierDTO>; total always equals the array length.
 *
 * @example
 * ```typescript
 * const response = await getSuppliersPage({ page: 1, pageSize: 20, q: 'acme' });
 * ```
 */
/**
 * @summary Searches suppliers by name via the dedicated backend search endpoint.
 * @backend GET /api/suppliers/search?name= → plain List<SupplierDTO>; case-insensitive substring match on name (findByNameContainingIgnoreCase)
 * @param name - Name fragment to match (case-insensitive substring).
 * @returns Matching SupplierRow[], or [] on error.
 *
 * @example
 * ```typescript
 * const results = await searchSuppliersByName('acme');
 * ```
 */
export const searchSuppliersByName = async (name: string): Promise<SupplierRow[]> => {
  try {
    const resp = await http.get(`${SUPPLIERS_BASE}/search`, { params: { name } });

    const data: unknown = typeof resp === 'object' && resp !== null && 'data' in resp
      ? (resp as unknown as Record<string, unknown>).data
      : [];

    const rowsRaw = extractSupplierRows(data);

    return rowsRaw
      .map(toSupplierRow)
      .filter((r): r is Exclude<ReturnType<typeof toSupplierRow>, null> => r !== null);
  } catch (error) {
    console.error('[searchSuppliersByName] Error searching suppliers by name:', error);
    return [];
  }
};

export const getSuppliersPage = async (
  params: SupplierListParams,
): Promise<SupplierListResponse> => {
  try {
    const resp = await http.get(SUPPLIERS_BASE, {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        ...(params.q && { q: params.q }),
        ...(params.sort && { sort: params.sort }),
      },
    });

    // httpClient passes through the raw Axios response without unwrapping; extract .data here
    const data: unknown = typeof resp === 'object' && resp !== null && 'data' in resp
      ? (resp as unknown as Record<string, unknown>).data
      : {};

    const rowsRaw = extractSupplierRows(data);

    // toSupplierRow returns null for malformed DTOs; filter keeps the array typed as SupplierRow[]
    const items = rowsRaw
      .map(toSupplierRow)
      .filter((r): r is Exclude<ReturnType<typeof toSupplierRow>, null> => r !== null);

    // Backend returns a plain array so total is always data.length; the object branch is dead code for the current backend.
    let total = 0;
    if (Array.isArray(data)) {
      total = data.length;
    } else if (typeof data === 'object' && data !== null) {
      const r = data as Record<string, unknown>;
      const totalElements = pickNumber(r, 'totalElements'); // BUCKET: totalElements never present; GET /api/suppliers is not a Spring Page (B#2)
      const totalField = pickNumber(r, 'total'); // BUCKET: total field absent from backend response shape (B#3)

      if (typeof totalElements === 'number') {
        total = totalElements;
      } else if (typeof totalField === 'number') {
        total = totalField;
      } else {
        total = rowsRaw.length;
      }
    }

    return {
      items,
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  } catch (error) {
    // Return an empty page so the UI renders a zero-row state instead of crashing.
    console.error('[getSuppliersPage] Error fetching suppliers:', error);
    return {
      items: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
};
