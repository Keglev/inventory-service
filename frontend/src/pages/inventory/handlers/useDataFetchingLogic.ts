/**
 * @file useDataFetchingLogic.ts
 * @module pages/inventory/handlers/useDataFetchingLogic
 *
 * @summary
 * Adapter between InventoryBoard state and useInventoryPageData. Owns the
 * pagination and sort-model transformations.
 *
 * @enterprise
 * - The sort-model array is joined into a comma-separated server query
 *   string; the grid's pagination model is forwarded as-is. Both the MUI
 *   grid and the backend Spring Pageable are 0-based, so the page index
 *   passes through unchanged (no conversion).
 * - Sort fallback 'name,asc' matches useInventoryState's default sort
 *   model so the first request matches the visible sort state without
 *   a re-render.
 */

import { useMemo } from 'react';
import { useInventoryPageData } from '../hooks/useInventoryPageData';
import type { InventoryState, InventoryStateSetters } from '../hooks/useInventoryState';

type InventoryStateReturn = InventoryState & InventoryStateSetters;

/**
 * Hook that prepares and executes data fetching with transformed state parameters.
 *
 * Responsibilities:
 * - Forward the 0-based pagination model to the server unchanged
 * - Format sort model into server query string
 * - Execute useInventoryPageData with prepared parameters
 *
 * @param state - Inventory board state object
 * @returns Data fetching result from useInventoryPageData
 */
export function useDataFetchingLogic(state: InventoryStateReturn) {
  // Prepare sort parameter for server
  const serverSort = useMemo(() => {
    return state.sortModel.length
      ? `${state.sortModel[0].field},${state.sortModel[0].sort ?? 'asc'}`
      : 'name,asc';
  }, [state.sortModel]);

  // Execute data fetching with prepared parameters
  const data = useInventoryPageData(
    state.supplierId,
    state.q,
    state.belowMinOnly,
    state.paginationModel.page, // 0-based grid page forwarded unchanged (backend Pageable is 0-based)
    state.paginationModel.pageSize,
    serverSort
  );

  return data;
}
