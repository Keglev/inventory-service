/**
 * @file listFetcher.ts
 * @module api/inventory/listFetcher
 *
 * @summary
 * Inventory list fetcher API call.
 * Handles HTTP request, Spring Page envelope parsing, and error recovery.
 *
 * @enterprise
 * - Single API endpoint: GET /api/inventory/search, the paginated backend
 *   endpoint (Spring Page<InventoryItemDTO>). All filters are optional on
 *   the server: empty name matches all active items, supplierId narrows to
 *   one supplier, belowMinimumOnly restricts to items below their minimum.
 * - Grid sort fields are frontend row-shape names; SORT_FIELD_MAP translates
 *   them to backend entity property names before the request. totalValue is
 *   server-computed (not an entity column) and therefore not sortable.
 * - Graceful error handling: returns an empty page on network failure.
 */

import http from '../httpClient';
import type { InventoryListParams, InventoryListResponse, InventoryRow } from './types';
import { toInventoryRow } from './rowNormalizers';
import { INVENTORY_BASE } from '../shared/constants';
import { logError } from '../../utils/logger';

/** Frontend grid field -> backend entity property for the Pageable sort. */
const SORT_FIELD_MAP: Record<string, string> = {
  name: 'name',
  code: 'sku',
  onHand: 'quantity',
  minQty: 'minimumQuantity',
  price: 'price',
  createdAt: 'createdAt',
};

/**
 * Translate a "field,direction" grid sort expression into the backend's
 * entity-property form. Unknown fields fall back to name,asc.
 */
const toServerSort = (sort: string | undefined): string => {
  if (!sort) return 'name,asc';
  const [field, direction = 'asc'] = sort.split(',');
  const mapped = SORT_FIELD_MAP[field];
  return mapped ? `${mapped},${direction}` : 'name,asc';
};

/**
 * Extract the rows array from a Spring Page envelope ({ content: [...] }).
 * A non-conforming response yields [].
 */
const extractRows = (data: unknown): unknown[] => {
  if (typeof data !== 'object' || data === null) return [];
  const content = (data as Record<string, unknown>).content;
  return Array.isArray(content) ? content : [];
};

/** Extract totalElements from a Spring Page envelope; falls back to the row count. */
const extractTotal = (data: unknown, fallback: number): number => {
  if (typeof data !== 'object' || data === null) return fallback;
  const total = (data as Record<string, unknown>).totalElements;
  return typeof total === 'number' && Number.isFinite(total) ? total : fallback;
};

/**
 * Fetch a page of inventory items from GET /api/inventory/search.
 *
 * @param params - Query params: page, pageSize, q (search), supplierId,
 *   sort (grid field names), belowMinimumOnly
 * @returns Paginated response with items and total count
 */
export const getInventoryPage = async (
  params: InventoryListParams,
): Promise<InventoryListResponse> => {
  try {
    const { page, pageSize, q, supplierId, sort, belowMinimumOnly } = params;

    const resp = await http.get(`${INVENTORY_BASE}/search`, {
      params: {
        name: q ?? '',
        supplierId,
        belowMinimumOnly: belowMinimumOnly ?? false,
        page,
        size: pageSize,
        sort: toServerSort(sort),
      },
    });

    // Extract response.data from Axios response
    const data: unknown = typeof resp === 'object' && resp !== null && 'data' in resp
      ? (resp as unknown as Record<string, unknown>).data
      : {};

    const rowsRaw = extractRows(data);

    // Normalize all rows and filter out failed normalizations
    const items: InventoryRow[] = rowsRaw
      .map(toInventoryRow)
      .filter((r): r is InventoryRow => r !== null);

    return {
      items,
      total: extractTotal(data, items.length),
      page,
      pageSize,
    };
  } catch (error) {
    // Network error: return empty page
    logError('[getInventoryPage] Error fetching inventory:', error);
    return {
      items: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
};
