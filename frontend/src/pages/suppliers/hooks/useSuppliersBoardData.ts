/**
 * @file useSuppliersBoardData.ts
 * @module pages/suppliers/hooks/useSuppliersBoardData
 *
 * @summary
 * Data fetching and processing for the suppliers board page.
 * Wires React Query for the suppliers list and the name search.
 *
 * @enterprise
 * - The list query (useSupplierListQuery -> GET /api/suppliers) returns every
 *   supplier; the backend does not paginate, sort or filter, so the grid does that
 *   in the browser. Name search is a separate concern handled by
 *   useSupplierSearchQuery (GET /api/suppliers/search), whose own hook owns
 *   debouncing/gating.
 * - Loading and error states; type-safe data transformations.
 */

import * as React from 'react';
import { useSupplierListQuery } from '../../../api/suppliers/hooks/useSupplierListQuery';
import { useSupplierSearchQuery } from '../../../api/suppliers/hooks/useSupplierSearchQuery';
import type { SupplierRow } from '../../../api/suppliers/types';

/**
 * Data and processing state for suppliers board.
 *
 * @interface SuppliersBoardData
 */
export interface SuppliersBoardData {
  // Server data: every supplier
  suppliers: SupplierRow[];

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
 * - The full suppliers list from the server
 * - Search results from useSupplierSearchQuery (debouncing handled inside that query hook, not here)
 * - Loading and error states
 * - Data synchronization
 *
 * @param searchQuery - Search query string (requires 2+ chars)
 * @returns Data and loading states
 *
 * @example
 * ```ts
 * const data = useSuppliersBoardData("search");
 * ```
 */
export const useSuppliersBoardData = (searchQuery: string): SuppliersBoardData => {
  // One fetch serves every page and sort order: the endpoint returns the full
  // list. Name search is handled by useSupplierSearchQuery.
  const suppliersQuery = useSupplierListQuery();

  const searchQueryResult = useSupplierSearchQuery(
    searchQuery.length >= 2 ? searchQuery : '',
    true
  );

  // Memoize the return object to keep a stable reference across renders and avoid
  // re-render loops that would otherwise churn router updates.
  return React.useMemo(
    () => {
      return {
        suppliers: suppliersQuery.data ?? [],
        searchResults: searchQueryResult.data ?? [],
        isLoadingSuppliers: suppliersQuery.isLoading,
        isLoadingSearch: searchQueryResult.isLoading,
        error: suppliersQuery.error?.message || null,
      };
    },
    [
      suppliersQuery.data,
      searchQueryResult.data,
      suppliersQuery.isLoading,
      searchQueryResult.isLoading,
      suppliersQuery.error?.message,
    ]
  );
};
