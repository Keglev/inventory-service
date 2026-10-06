/**
 * @file supplierListFetcher.ts
 * @module api/suppliers/supplierListFetcher
 *
 * @summary
 * Fetches the supplier list from GET /api/suppliers and normalizes each raw DTO into a SupplierRow.
 *
 * @enterprise
 * - Backend returns a plain JSON array (List<SupplierDTO>) — no Spring Page envelope, no server-side pagination.
 * - The list endpoint takes no parameters; the suppliers grid pages and sorts the full list in the browser.
 * - On network failure the list fetcher returns an empty list so the UI degrades cleanly rather than throwing.
 */

import http from '../httpClient';
import type { SupplierRow } from './types';
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
 * Fetches every supplier from GET /api/suppliers, normalized to SupplierRow.
 *
 * @backend GET /api/suppliers -> plain List<SupplierDTO>, no parameters.
 * @returns All suppliers, or [] on a network error so the board renders an
 *   empty state instead of crashing.
 */
export const getAllSuppliers = async (): Promise<SupplierRow[]> => {
  try {
    const resp = await http.get(SUPPLIERS_BASE);

    // httpClient passes through the raw Axios response without unwrapping; extract .data here
    const data: unknown = typeof resp === 'object' && resp !== null && 'data' in resp
      ? (resp as unknown as Record<string, unknown>).data
      : {};

    // toSupplierRow returns null for malformed DTOs; filter keeps the array typed as SupplierRow[]
    return extractSupplierRows(data)
      .map(toSupplierRow)
      .filter((r): r is Exclude<ReturnType<typeof toSupplierRow>, null> => r !== null);
  } catch (error) {
    logError('[getAllSuppliers] Error fetching suppliers:', error);
    return [];
  }
};
