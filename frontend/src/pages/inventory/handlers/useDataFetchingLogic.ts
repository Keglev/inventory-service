/**
 * @file useDataFetchingLogic.ts
 * @module pages/inventory/handlers/useDataFetchingLogic
 *
 * @summary
 * Custom hook that prepares data fetching parameters from board state.
 * Transforms UI state into server-compatible query parameters.
 *
 * @enterprise
 * - Separation of concerns: data parameter transformation isolated
 * - Single responsibility: converts state to API query format
 * - Memoized calculations for sorting
 */

import { useMemo } from 'react';
import { useInventoryData } from '../hooks/useInventoryData';
import type { InventoryState, InventoryStateSetters } from '../hooks/useInventoryState';

type InventoryStateReturn = InventoryState & InventoryStateSetters;

/**
 * Hook that prepares and executes data fetching with transformed state parameters.
 *
 * Responsibilities:
 * - Convert 0-based pagination to 1-based for server
 * - Format sort model into server query string
 * - Execute useInventoryData with prepared parameters
 *
 * @param state - Inventory board state object
 * @returns Data fetching result from useInventoryData
 *
 * @example
 * ```tsx
 * const data = useDataFetchingLogic(state);
 * ```
 */
export function useDataFetchingLogic(state: InventoryStateReturn) {
  // Prepare sort parameter for server
  const serverSort = useMemo(() => {
    return state.sortModel.length
      ? `${state.sortModel[0].field},${state.sortModel[0].sort ?? 'asc'}`
      : 'name,asc';
  }, [state.sortModel]);

  // Execute data fetching with prepared parameters
  const data = useInventoryData(
    state.supplierId,
    state.q,
    state.belowMinOnly,
    state.paginationModel.page + 1, // Convert 0-based to 1-based
    state.paginationModel.pageSize,
    serverSort
  );

  return data;
}
