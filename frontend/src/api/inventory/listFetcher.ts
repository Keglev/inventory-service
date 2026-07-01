/**
 * @file listFetcher.ts
 * @module api/inventory/listFetcher
 *
 * @summary
 * Inventory list fetcher API call.
 * Handles HTTP request, response envelope parsing, and error recovery.
 *
 * @enterprise
 * - Single API endpoint: GET /api/inventory (getAll), which returns a plain
 *   JSON array (List<InventoryItemDTO>) and does not paginate. Pagination
 *   params are accepted by this client but ignored by the backend (CB-APP68).
 * - Graceful error handling: returns an empty page on network failure.
 * - Type-safe response structure.
 */

import http from '../httpClient';
import type { InventoryListParams, InventoryListResponse, InventoryRow } from './types';
import { toInventoryRow } from './rowNormalizers';
import { INVENTORY_BASE } from '@/api/shared';

/**
 * Extract the array of rows from the response. GET /api/inventory returns a
 * plain array, so a non-array response (error / empty object) yields [].
 *
 * @param data - Response data from /api/inventory
 * @returns Array of raw DTO objects to normalize
 */
const extractRows = (data: unknown): unknown[] => (Array.isArray(data) ? data : []);

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

    const resp = await http.get(INVENTORY_BASE, {
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

    // GET /api/inventory returns a plain array, so the total is its length.
    const total = rowsRaw.length;

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
