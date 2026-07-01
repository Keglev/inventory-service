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
 * - Client-side supplier filtering is a defensive safeguard: the backend
 *   already filters by supplierId, but the client re-filters in case
 *   the response leaks cross-supplier rows. Same defensive posture as
 *   PriceTrendCard in analytics.
 * - Below-minimum threshold uses a fallback of 5 when minQty is absent
 *   or non-positive. This is the same low-stock business rule that
 *   drives LowStockTable's critical chip. Tracked under CB-APP42 --
 *   the literal 5 is duplicated across three sites (this file,
 *   useInventoryRowStyling, and analytics LowStockTable) and should be
 *   extracted to a shared constant in the refactor phase.
 * - console.error on load failure is unguarded and ships to production
 *   browser devtools. Tracked under CB-APP45 (same class as CB-APP29 /
 *   CB-APP35 / CB-APP37).
 */

import * as React from 'react';
import { useSuppliersQuery } from '../../../api/inventory/hooks';
import { getInventoryPage, type InventoryListResponse, type InventoryRow } from '../../../api/inventory';
import type { GridColDef } from '@mui/x-data-grid';
import { useInventoryColumns } from './useInventoryColumns';
import { useInventoryRowStyling } from './useInventoryRowStyling';

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

  // Processed/filtered items
  filteredItems: InventoryRow[];

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
 * - Loading suppliers for filter dropdown
 * - Client-side filtering by search query and below-min threshold
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
        q,
        supplierId: supplierId ?? undefined,
        sort: serverSort,
      });
      setServer(res);
    } catch (err) {
      // BUCKET: CB-APP45 -- unguarded console.error ships to production devtools.
      console.error('Failed to load inventory:', err);
      setServer({ items: [], total: 0, page: serverPage, pageSize });
    } finally {
      setLoading(false);
    }
  }, [serverPage, pageSize, q, supplierId, serverSort]);

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

  // Client-side filtering by supplier (fallback)
  const supplierFiltered = React.useMemo(() => {
    if (!supplierId) return server.items;
    const sid = String(supplierId);
    return server.items.filter((r) => String(r.supplierId ?? '') === sid);
  }, [server.items, supplierId]);

  // Final filtered items with search and below-min
  const filteredItems = React.useMemo(() => {
    let rows = supplierFiltered;

    // Search by name
    const qTrim = q.trim().toLowerCase();
    if (qTrim.length > 0) {
      rows = rows.filter((r) => (r.name ?? '').toLowerCase().includes(qTrim));
    }

    // Filter by below-min threshold
    if (belowMinOnly) {
      rows = rows.filter((r) => {
        const minRaw = Number(r.minQty ?? 0);
        // BUCKET: CB-APP42 -- duplicated low-stock threshold (5). Extract to shared constant.
        const min = Number.isFinite(minRaw) && minRaw > 0 ? minRaw : 5;
        const onHand = Number(r.onHand ?? 0);
        return onHand < min;
      });
    }

    return rows;
  }, [supplierFiltered, q, belowMinOnly]);

  return {
    server,
    loading,
    suppliers: suppliersQuery.data,
    supplierLoading: suppliersQuery.isLoading,
    filteredItems,
    columns,
    getRowClassName,
    reload,
  };
};
