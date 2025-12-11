/**
 * @file useInventoryData.ts
 * @module pages/inventory/hooks/useInventoryData
 *
 * @summary
 * Data fetching and processing for inventory page.
 * Handles backend queries, client-side filtering, and derived computations.
 *
 * @enterprise
 * - Separates data concerns from UI state
 * - Encapsulates backend API calls and error handling
 * - Provides processed data ready for rendering
 */

import * as React from 'react';
import { useSuppliersQuery } from '../../../api/inventory/hooks/useInventoryData';
import { getInventoryPage, type InventoryListResponse, type InventoryRow } from '../../../api/inventory';
import type { GridColDef } from '@mui/x-data-grid';
import { useInventoryColumns } from './useInventoryColumns';
import { useInventoryRowStyling } from './useInventoryRowStyling';

/**
 * Inventory data loading and processing results.
 * 
 * @interface InventoryDataResult
 */
export interface InventoryDataResult {
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
 * @param serverPage - Current page (1-based)
 * @param pageSize - Items per page
 * @param serverSort - Sort string (field,direction)
 * @returns Data loading results
 */
export const useInventoryData = (
  supplierId: string | number | null,
  q: string,
  belowMinOnly: boolean,
  serverPage: number,
  pageSize: number,
  serverSort: string
): InventoryDataResult => {
  const [server, setServer] = React.useState<InventoryListResponse>({
    items: [],
    total: 0,
    page: 1,
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
    const res = await getInventoryPage({
      page: serverPage,
      pageSize,
      q,
      supplierId: supplierId ?? undefined,
      sort: serverSort,
    });
    setServer(res);
    setLoading(false);
  }, [serverPage, pageSize, q, supplierId, serverSort]);

  React.useEffect(() => {
    if (supplierId) {
      void load();
    } else {
      setServer((s) => ({ ...s, items: [], total: 0 }));
    }
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
  };
};
