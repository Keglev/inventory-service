/**
 * @file useSuppliersBoardData.ts
 * @module pages/suppliers/hooks/useSuppliersBoardData
 *
 * @summary
 * Data fetching and processing for suppliers board page.
 * Handles React Query integration for suppliers list and search.
 *
 * @enterprise
 * - Server-side pagination and sorting
 * - Search query is forwarded to useSupplierSearchQuery; debouncing is handled inside that query hook, not in this file
 * - Loading and error states
 * - Type-safe data transformations
 */

import * as React from 'react';
import { useSuppliersPageQuery, useSupplierSearchQuery } from '../../../api/suppliers';
import type { SupplierRow } from '../../../api/suppliers';

/**
 * Data and processing state for suppliers board.
 *
 * @interface SuppliersBoardData
 */
export interface SuppliersBoardData {
  // Server data
  suppliers: SupplierRow[];
  total: number;

  // Search results
  searchResults: SupplierRow[];

  // Loading & error states
  isLoadingSuppliers: boolean;
  isLoadingSearch: boolean;
  error: string | null;
}

/**
 * Hook for suppliers board data fetching and processing.
 *
 * Manages:
 * - Paginated suppliers list from server
 * - Search results from useSupplierSearchQuery (debouncing handled inside that query hook, not here)
 * - Loading and error states
 * - Data synchronization
 *
 * @param page - Current page (1-based)
 * @param pageSize - Items per page
 * @param sort - Sort string (e.g., "name,asc")
 * @param searchQuery - Search query string (requires 2+ chars)
 * @returns Data and loading states
 *
 * @example
 * ```ts
 * const data = useSuppliersBoardData(1, 10, "name,asc", "search");
 * ```
 */
export const useSuppliersBoardData = (
  page: number,
  pageSize: number,
  sort: string,
  searchQuery: string,
  showAllSuppliers: boolean = true
): SuppliersBoardData => {
  // CM-APP12: debug console.log — remove in refactor pass.
  console.log('[useSuppliersBoardData] CALLED with:', { page, pageSize, sort, searchQuery, showAllSuppliers });
  
  // Fetch paginated suppliers list
  // Only pass search query to paginated API if showAllSuppliers is true
  const suppliersQuery = useSuppliersPageQuery(
    {
      page,
      pageSize,
      sort,
      q: (showAllSuppliers && searchQuery.length >= 2) ? searchQuery : undefined,
    },
    true
  );

  // CM-APP12: debug console.log — remove in refactor pass.
  console.log('[useSuppliersBoardData] suppliersQuery data identity:', suppliersQuery.data);

  // Search suppliers by query - always available regardless of showAllSuppliers flag
  const searchQueryResult = useSupplierSearchQuery(
    searchQuery.length >= 2 ? searchQuery : '',
    true
  );

  // CM-APP12: debug console.log — remove in refactor pass.
  console.log('[useSuppliersBoardData] about to return, will create new object');

  // Memoize the return object to prevent creating new reference on every render
  // This is critical to avoid infinite re-render loops that freeze router updates
  return React.useMemo(
    () => {
      // CM-APP12: debug console.log — remove in refactor pass.
      console.log('[useSuppliersBoardData] useMemo RUNNING - creating new data object');
      return {
        suppliers: suppliersQuery.data?.items ?? [],
        total: suppliersQuery.data?.total ?? 0,
        searchResults: searchQueryResult.data ?? [],
        isLoadingSuppliers: suppliersQuery.isLoading,
        isLoadingSearch: searchQueryResult.isLoading,
        error: suppliersQuery.error?.message || null,
      };
    },
    [
      suppliersQuery.data?.items,
      suppliersQuery.data?.total,
      searchQueryResult.data,
      suppliersQuery.isLoading,
      searchQueryResult.isLoading,
      suppliersQuery.error?.message,
    ]
  );
};
