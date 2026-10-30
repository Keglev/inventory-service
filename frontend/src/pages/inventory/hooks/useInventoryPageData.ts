/**
 * @file useInventoryPageData.ts
 * @module pages/inventory/hooks/useInventoryPageData
 *
 * @summary
 * Inventory data orchestration: composes the api-layer suppliers query
 * and inventory page fetch, forwards the search, supplier, and below-minimum
 * filters (with pagination and sorting) to the server, and exposes column
 * definitions and row styling for the DataGrid.
 *
 * @enterprise
 * - Composition over duplication. This hook composes the api-layer
 *   useSuppliersQuery and getInventoryPage; it does not re-implement
 *   transport. The page is a React Query keyed by its filters, so a late
 *   response for filters already left cannot overwrite the current page.
 * - serverPage is 0-based (Spring Pageable), matching the MUI grid's own
 *   0-based page model; it is forwarded to getInventoryPage unchanged.
 *   No index conversion occurs anywhere in this path.
 * - Without a supplier the board lists the stock of all suppliers, one
 *   server page at a time (S2-9, Carlos 2026-10-30); the former gate that
 *   waited for a supplier or "below minimum" is gone.
 * - All filtering is server-side: q, supplierId, and the
 *   below-minimum flag are sent to GET /api/inventory/search and the
 *   returned page is rendered as-is. The search input is debounced here
 *   so the server is not queried on every keystroke.
 */

import * as React from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSuppliersQuery } from '../../../api/inventory/hooks/useSuppliersQuery';
import { getInventoryPage } from '../../../api/inventory/listFetcher';
import type { InventoryListResponse, InventoryRow } from '../../../api/inventory/types';
import type { GridColDef } from '@mui/x-data-grid';
import { useInventoryColumns } from './useInventoryColumns';
import { useInventoryRowStyling } from './useInventoryRowStyling';
import { logError } from '../../../utils/logger';
import { useDebounced } from '../../../hooks/useDebounced';

/**
 * Inventory data loading and processing results.
 *
 * @interface InventoryPageDataResult
 */
export interface InventoryPageDataResult {
  // Raw data from backend
  server: InventoryListResponse;
  loading: boolean;

  // Suppliers for filter
  suppliers: ReturnType<typeof useSuppliersQuery>['data'];
  supplierLoading: boolean;

  // Items of the current server page (all filtering is server-side)
  items: InventoryRow[];

  // Column definitions
  columns: GridColDef[];

  // Row styling function
  getRowClassName: (onHand: number, minQty: number) => string;

  // Explicit refetch of the current query (page/size/filters preserved)
  reload: () => void;
}

/**
 * Hook for inventory data fetching and processing.
 *
 * Handles:
 * - Loading inventory from backend with filters/pagination/sorting
 *   (search, supplier, and below-minimum filters are server-side)
 * - Loading suppliers for the supplier search field
 * - Column definitions with proper formatting
 * - Row classification for visual styling
 *
 * @param supplierId - Selected supplier ID, or null for all suppliers
 * @param q - Search query (debounced)
 * @param belowMinOnly - Whether to filter for below-min items only
 * @param serverPage - Current page (0-based, Spring Pageable)
 * @param pageSize - Items per page
 * @param serverSort - Sort string (field,direction)
 * @returns Data loading results
 */
export const useInventoryPageData = (
  supplierId: string | number | null,
  q: string,
  belowMinOnly: boolean,
  serverPage: number,
  pageSize: number,
  serverSort: string
): InventoryPageDataResult => {
  // Debounce the search input so typing does not fire a request per keystroke
  const debouncedQ = useDebounced(q, 300);

  // Load suppliers for filter dropdown
  const suppliersQuery = useSuppliersQuery(true);

  // Column definitions
  const columns = useInventoryColumns(!supplierId);

  // Row styling function
  const getRowClassName = useInventoryRowStyling();

  const params = {
    page: serverPage,
    pageSize,
    q: debouncedQ,
    supplierId: supplierId ?? undefined,
    sort: serverSort,
    belowMinimumOnly: belowMinOnly,
  };

  // The page belongs to its filters (the query key), so a slow response for
  // filters the user has already left can no longer overwrite the current one.
  const pageQuery = useQuery({
    queryKey: ['inventory', 'page', params],
    queryFn: async () => {
      try {
        return await getInventoryPage(params);
      } catch (err) {
        logError('Failed to load inventory:', err);
        throw err;
      }
    },
    // The rows of the previous filters stay on screen while the next page
    // loads, as before; the grid shows its loading state over them.
    placeholderData: keepPreviousData,
    // WHY: the grid must show what the server holds after an edit elsewhere;
    // the app-wide 60 s staleTime would serve a cached page instead.
    staleTime: 0,
    // WHY: a failed load empties the grid at once, as before; a retry would
    // hold the old rows for another round trip.
    retry: false,
  });

  // A failed load shows an empty page, also when a reload of a page that had
  // loaded before fails (React Query would keep the last data).
  // Memoized so the grid receives the same rows array until the data changes.
  const { data, isError } = pageQuery;
  const server = React.useMemo<InventoryListResponse>(
    () =>
      data && !isError
        ? data
        : { items: [], total: 0, page: serverPage, pageSize },
    [data, isError, serverPage, pageSize],
  );

  // Explicit refresh path. Re-runs the current query directly rather than
  // poking paginationModel back to page 0, which no-opped when the user was
  // already on page 0 (React bails on an equal setState).
  const { refetch } = pageQuery;
  const reload = React.useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    server,
    loading: pageQuery.isFetching,
    suppliers: suppliersQuery.data,
    supplierLoading: suppliersQuery.isLoading,
    items: server.items,
    columns,
    getRowClassName,
    reload,
  };
};
