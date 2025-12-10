/**
 * @file listFetcher.ts
 * @module api/inventory/listFetcher
 *
 * @summary
 * Inventory list fetcher API call.
 * Handles HTTP request, response envelope parsing, and error recovery.
 *
 * @enterprise
 * - Single API endpoint: GET /api/inventory with pagination params
 * - Tolerant of response envelope variations (plain array, Spring Page format)
 * - Graceful error handling: returns empty page on network failure
 * - Type-safe response structure
 */

import http from '../httpClient';
import type { InventoryListParams, InventoryListResponse, InventoryRow } from './types';
import { toInventoryRow } from './rowNormalizers';
import { pickNumber } from './utils';

/**
 * Extract an array of rows from various envelope styles.
 * Supports:
 *  - plain array: [dto, dto, ...]
 *  - Spring Page: { content: [...], totalElements: 5 }
 *  - custom: { items: [...] }
 *
 * @param data - Response data from /api/inventory
 * @returns Array of raw DTO objects to normalize
 *
 * @example
 * ```typescript
 * const rows = extractRows(response.data);
 * ```
 */
const extractRows = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data;
  if (typeof data !== 'object' || data === null) return [];

  const r = data as Record<string, unknown>;

  // Try Spring Page 'content' field
  if (Array.isArray(r.content)) return r.content;

  // Try custom 'items' field
  if (Array.isArray(r.items)) return r.items;

  return [];
};

/**
 * Fetch a page of inventory items from the backend.
 * Handles pagination, search, filtering, and sorting.
 * Works with various response envelope formats transparently.
 *
 * @param params - Query params: page, pageSize, q (search), supplierId, sort
 * @returns Paginated response with items and total count
 *
 * @example
 * ```typescript
 * const response = await getInventoryPage({
 *   page: 0,
 *   pageSize: 20,
 *   q: 'bolt',
 *   supplierId: undefined,
 *   sort: 'name,asc'
 * });
 * ```
 */
export const getInventoryPage = async (
  params: InventoryListParams,
): Promise<InventoryListResponse> => {
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

    // Extract response.data from Axios response
    const data: unknown = typeof resp === 'object' && resp !== null && 'data' in resp
      ? (resp as unknown as Record<string, unknown>).data
      : {};

    const rowsRaw = extractRows(data);

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

    // Normalize all rows and filter out failed normalizations
    const items: InventoryRow[] = rowsRaw
      .map(toInventoryRow)
      .filter((r): r is InventoryRow => r !== null);

    return {
      items,
      total,
      page,
      pageSize,
    };
  } catch (error) {
    // Network error: return empty page
    console.error('[getInventoryPage] Error fetching inventory:', error);
    return {
      items: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
};
