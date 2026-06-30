/**
 * @file useDataFetchingLogic.ts
 * @module pages/inventory/handlers/useDataFetchingLogic
 *
 * @summary
 * Adapter between InventoryBoard state and useInventoryPageData. Owns the
 * pagination and sort-model transformations.
 *
 * @enterprise
 * - Two transformations live here: pagination 0-based (MUI grid) to
 *   1-based (useInventoryPageData's documented contract), and sort-model
 *   array to comma-separated server query string.
 * - Confirmed caller site for CB-F. useInventoryPageData's serverPage is
 *   documented as 1-based, but the inventory backend is 0-based Spring
 *   Pageable. The net effect at this site is an off-by-one: page 0 in
 *   the grid asks the backend for page 1, skipping the first server
 *   page. Fix in the refactor phase is to normalize useInventoryPageData
 *   to 0-based and remove the +1 here.
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
 * - Convert 0-based pagination to 1-based for server
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
     // BUCKET: CB-F -- confirmed off-by-one. Caller is 0-based; useInventoryPageData hook param doc says 1-based; backend is 0-based. Drop +1 once hook param is normalized.
    state.paginationModel.page + 1, // Convert 0-based to 1-based
    state.paginationModel.pageSize,
    serverSort
  );

  return data;
}
