/**
 * @file useSuppliersBoardData.ts
 * @module pages/suppliers/hooks/useSuppliersBoardData
 *
 * @summary
 * Data fetching and processing for the suppliers board page.
 * Wires React Query for the suppliers list and the name search.
 *
 * @enterprise
 * - The list query (useSuppliersPageQuery -> GET /api/suppliers) returns the full
 *   array; the backend does not paginate/sort/filter server-side, so no search q
 *   is sent here. Name search is a separate concern handled by useSupplierSearchQuery
 *   (GET /api/suppliers/search), whose own hook owns debouncing/gating.
 * - Loading and error states; type-safe data transformations.
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
  searchQuery: string
): SuppliersBoardData => {
  // The list endpoint returns the full array and ignores query params, so no
  // search q is sent here. Name search is handled by useSupplierSearchQuery.
  const suppliersQuery = useSuppliersPageQuery(
    { page, pageSize, sort },
    true
  );

  const searchQueryResult = useSupplierSearchQuery(
    searchQuery.length >= 2 ? searchQuery : '',
    true
  );

  // Memoize the return object to keep a stable reference across renders and avoid
  // re-render loops that would otherwise churn router updates.
  return React.useMemo(
    () => {
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
