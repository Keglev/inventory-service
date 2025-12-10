/**
 * @file supplierListFetcher.ts
 * @module api/suppliers/supplierListFetcher
 *
 * @summary
 * Supplier list fetcher API call.
 * Handles HTTP request, response envelope parsing, and error recovery.
 *
 * @enterprise
 * - Single API endpoint: GET /api/suppliers with pagination params
 * - Tolerant of response envelope variations (plain array, Spring Page format)
 * - Graceful error handling: returns empty page on network failure
 * - Type-safe response structure
 */

import http from '../httpClient';
import type { SupplierListParams, SupplierListResponse } from './types';
import { toSupplierRow } from './supplierNormalizers';
import { pickNumber, extractArray } from '../inventory/utils';

/** Centralized endpoint base. */
export const SUPPLIERS_BASE = '/api/suppliers';

/**
 * Extract an array of rows from various envelope styles.
 * Supports:
 *  - plain array: [dto, dto, ...]
 *  - Spring Page: { content: [...], totalElements: 5 }
 *  - custom: { items: [...] }
 *
 * @param data - Response data from /api/suppliers
 * @returns Array of raw DTO objects to normalize
 *
 * @example
 * ```typescript
 * const rows = extractSupplierRows(response.data);
 * ```
 */
const extractSupplierRows = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data;
  if (typeof data !== 'object' || data === null) return [];

  return extractArray(data, ['content', 'items', 'results']);
};

/**
 * Fetch paginated suppliers from backend.
 * Works with various response envelope formats transparently.
 *
 * @param params - Filter, pagination, sort parameters
 * @returns Paginated supplier list or empty fallback on error
 *
 * @example
 * ```typescript
 * const response = await getSuppliersPage({
 *   page: 1,
 *   pageSize: 20,
 *   q: 'acme'
 * });
 * ```
 */
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

    // Extract response.data from Axios response
    const data: unknown = typeof resp === 'object' && resp !== null && 'data' in resp
      ? (resp as unknown as Record<string, unknown>).data
      : {};

    const rowsRaw = extractSupplierRows(data);

    // Normalize all rows and filter out failed normalizations
    const items = rowsRaw
      .map(toSupplierRow)
      .filter((r): r is Exclude<ReturnType<typeof toSupplierRow>, null> => r !== null);

    // Calculate total count from response
    let total = 0;
    if (Array.isArray(data)) {
      // Plain array: total = array length
      total = data.length;
    } else if (typeof data === 'object' && data !== null) {
      const r = data as Record<string, unknown>;
      // Try Spring Page field first (totalElements), then custom (total)
      const totalElements = pickNumber(r, 'totalElements');
      const totalField = pickNumber(r, 'total');

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
    // Network error: return empty page
    console.error('[getSuppliersPage] Error fetching suppliers:', error);
    return {
      items: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
};
