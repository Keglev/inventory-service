/**
 * @file useInventoryPageData.ts
 * @module pages/inventory/hooks/useInventoryPageData
 *
 * @summary
 * Inventory data orchestration: composes the api-layer suppliers query
 * and inventory page fetch, applies client-side filters, and exposes
 * column definitions and row styling for the DataGrid.
 *
 * @enterprise
 * - Composition over duplication. This hook composes the api-layer
 *   useSuppliersQuery and getInventoryPage; it does not re-implement
 *   transport. The api-layer useInventoryData remains the transport-
 *   facing hook; this pages-layer hook adapts it for the inventory
 *   board.
 * - serverPage is 0-based (Spring Pageable), matching the MUI grid's own
 *   0-based page model; it is forwarded to getInventoryPage unchanged.
 *   No index conversion occurs anywhere in this path.
 * - All filtering is server-side: q, supplierId, and the
 *   below-minimum flag are sent to GET /api/inventory/search and the
 *   returned page is rendered as-is. The search input is debounced here
 *   so the server is not queried on every keystroke.
 */

import * as React from 'react';
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
 * - Loading suppliers for filter dropdown
 * - Column definitions with proper formatting
 * - Row classification for visual styling
 *
 * @param supplierId - Selected supplier ID (null to not load)
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
  const [server, setServer] = React.useState<InventoryListResponse>({
    items: [],
    total: 0,
    page: 0,
    pageSize: 10,
  });
  const [loading, setLoading] = React.useState(false);

  // Debounce the search input so typing does not fire a request per keystroke
  const debouncedQ = useDebounced(q, 300);

  // Load suppliers for filter dropdown
  const suppliersQuery = useSuppliersQuery(true);

  // Column definitions
  const columns = useInventoryColumns();

  // Row styling function
  const getRowClassName = useInventoryRowStyling();

  // Load inventory from backend
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInventoryPage({
        page: serverPage,
        pageSize,
        q: debouncedQ,
        supplierId: supplierId ?? undefined,
        sort: serverSort,
        belowMinimumOnly: belowMinOnly,
      });
      setServer(res);
    } catch (err) {
      logError('Failed to load inventory:', err);
      setServer({ items: [], total: 0, page: serverPage, pageSize });
    } finally {
      setLoading(false);
    }
  }, [serverPage, pageSize, debouncedQ, belowMinOnly, supplierId, serverSort]);

  React.useEffect(() => {
    if (supplierId) {
      void load();
    } else {
      setServer((s) => ({ ...s, items: [], total: 0 }));
    }
  }, [supplierId, load]);

  // Explicit refresh path. Re-runs the current query directly rather than
  // poking paginationModel back to page 0, which no-opped when the user was
  // already on page 0 (React bails on an equal setState). Guarded on
  // supplierId to preserve the "no supplier -> no unfiltered fetch" invariant.
  const reload = React.useCallback(() => {
    if (supplierId) void load();
  }, [supplierId, load]);

  return {
    server,
    loading,
    suppliers: suppliersQuery.data,
    supplierLoading: suppliersQuery.isLoading,
    items: server.items,
    columns,
    getRowClassName,
    reload,
  };
};
