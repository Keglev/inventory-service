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
 * - No memoization needed - simple calculations are cheap
 */

import { useSuppliersBoardData } from '../hooks/useSuppliersBoardData';
import type { UseSuppliersBoardStateReturn } from '../hooks/useSuppliersBoardState';

/**
 * Hook that prepares and executes data fetching with transformed state parameters.
 *
 * Responsibilities:
 * - Currently increments paginationModel.page by 1 before forwarding. NOTE: backend Pageable is 0-based — this conversion is incorrect and is tracked as CB-F.
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
  // CM-APP12: debug console.log — remove in refactor pass.
  console.log('[DATA FETCHING LOGIC] called with pagination:', state.paginationModel);

  // Prepare parameters for data hook (no memoization needed)
  // CB-F: off-by-one — backend Pageable is 0-based; this +1 produces a 1-based page number. Tracked for refactor.
  const serverPage = state.paginationModel.page + 1;

  const serverSort = state.sortModel.length
    ? `${state.sortModel[0].field},${state.sortModel[0].sort ?? 'asc'}`
    : 'name,asc';

  // Always pass the search query to the data hook for search results dropdown
  // The data hook will use it appropriately for both search and pagination
  const data = useSuppliersBoardData(
    serverPage,
    state.paginationModel.pageSize,
    serverSort,
    state.searchQuery,
    state.showAllSuppliers  // Pass this flag so the hook knows whether to filter paginated results
  );

  // CM-APP12: debug console.log — remove in refactor pass.
  console.log('[DATA FETCHING LOGIC] returning data, suppliers count:', data.suppliers.length);
  return data;
}
