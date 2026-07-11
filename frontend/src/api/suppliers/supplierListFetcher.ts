/**
 * @file supplierListFetcher.ts
 * @module api/suppliers/supplierListFetcher
 *
 * @summary
 * Fetches the supplier list from GET /api/suppliers and normalizes each raw DTO into a SupplierRow.
 *
 * @enterprise
 * - Backend returns a plain JSON array (List<SupplierDTO>) — no Spring Page envelope, no server-side pagination.
 * - page/pageSize/q/sort are forwarded as query params but are ignored server-side.
 * - On network failure the fetcher returns an empty page so the UI degrades cleanly rather than throwing.
 */

import http from '../httpClient';
import type { SupplierListParams, SupplierListResponse, SupplierRow } from './types';
import { toSupplierRow } from './supplierNormalizers';
import { logError } from '../../utils/logger';

/** Centralized endpoint base. */
export const SUPPLIERS_BASE = '/api/suppliers';

/**
 * Extracts the raw DTO array from the GET /api/suppliers response body.
 * The backend returns a plain array, so a non-array body yields [].
 *
 * @param data - Response body from GET /api/suppliers (a bare JSON array).
 * @returns Array of raw DTO objects to normalize
 *
 * @example
 * ```typescript
 * const rows = extractSupplierRows(response.data);
 * ```
 */
const extractSupplierRows = (data: unknown): unknown[] => (Array.isArray(data) ? data : []);

/**
 * Fetches suppliers from GET /api/suppliers and returns a SupplierListResponse envelope.
 *
 * @param params - page/pageSize/sort/q forwarded as query params; backend does not page server-side.
 * @returns Normalized supplier list, or an empty page on network error
 *
 * @backend GET /api/suppliers -> plain List<SupplierDTO>; total always equals the array length.
 *
 * @example
 * ```typescript
 * const response = await getSuppliersPage({ page: 1, pageSize: 20, q: 'acme' });
 * ```
 */
/**
 * @summary Searches suppliers by name via the dedicated backend search endpoint.
 * @backend GET /api/suppliers/search?name= -> plain List<SupplierDTO>; case-insensitive substring match on name (findByNameContainingIgnoreCase)
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
    logError('[searchSuppliersByName] Error searching suppliers by name:', error);
    return [];
  }
};

/**
 * Fetches a single supplier by id via GET /api/suppliers/:id.
 *
 * @param id - Supplier id
 * @returns The normalized SupplierRow, or null when not found / on error
 *
 * @backend GET /api/suppliers/:id (SupplierController.getById) -> single SupplierDTO; 404 when absent.
 *
 * @example
 * ```typescript
 * const supplier = await getSupplierById('SUP-1');
 * ```
 */
export const getSupplierById = async (id: string): Promise<SupplierRow | null> => {
  try {
    const resp = await http.get(`${SUPPLIERS_BASE}/${encodeURIComponent(id)}`);
    const data: unknown = typeof resp === 'object' && resp !== null && 'data' in resp
      ? (resp as unknown as Record<string, unknown>).data
      : null;
    return toSupplierRow(data);
  } catch (error) {
    logError('[getSupplierById] Error fetching supplier by id:', error);
    return null;
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

    // Backend returns a plain array, so total is the row count.
    const total = rowsRaw.length;

    return {
      items,
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  } catch (error) {
    // Return an empty page so the UI renders a zero-row state instead of crashing.
    logError('[getSuppliersPage] Error fetching suppliers:', error);
    return {
      items: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
};
