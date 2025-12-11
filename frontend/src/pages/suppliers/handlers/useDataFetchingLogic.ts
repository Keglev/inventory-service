/**
 * @file useDataFetchingLogic.ts
 * @module pages/suppliers/handlers/useDataFetchingLogic
 *
 * @summary
 * Custom hook that prepares data fetching parameters from board state.
 * Transforms UI state into server-compatible query parameters.
 *
 * @enterprise
 * - Separation of concerns: data parameter transformation isolated
 * - Single responsibility: converts state to API query format
 * - Memoized calculations for pagination and sorting
 */

import { useMemo } from 'react';
import { useSuppliersBoardData } from '../hooks/useSuppliersBoardData';
import type { UseSuppliersBoardStateReturn } from '../hooks/useSuppliersBoardState';

/**
 * Hook that prepares and executes data fetching with transformed state parameters.
 *
 * Responsibilities:
 * - Convert 0-based pagination to 1-based for server
 * - Format sort model into server query string
 * - Execute useSuppliersBoardData with prepared parameters
 *
 * @param state - Suppliers board state object
 * @returns Data fetching result from useSuppliersBoardData
 *
 * @example
 * ```tsx
 * const data = useDataFetchingLogic(state);
 * ```
 */
export function useDataFetchingLogic(state: UseSuppliersBoardStateReturn) {
  // Prepare parameters for data hook
  const serverPage = useMemo(() => state.paginationModel.page + 1, [state.paginationModel.page]);

  const serverSort = useMemo(() => {
    return state.sortModel.length
      ? `${state.sortModel[0].field},${state.sortModel[0].sort ?? 'asc'}`
      : 'name,asc';
  }, [state.sortModel]);

  // Execute data fetching with prepared parameters
  const data = useSuppliersBoardData(
    serverPage,
    state.paginationModel.pageSize,
    serverSort,
    state.searchQuery
  );

  return data;
}
