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
 * - Client-side search with debouncing
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
 * - Search results with debouncing
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
  const [suppliers, setSuppliers] = React.useState<SupplierRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [searchResults, setSearchResults] = React.useState<SupplierRow[]>([]);

  // Fetch paginated suppliers list
  const suppliersQuery = useSuppliersPageQuery(
    {
      page,
      pageSize,
      sort,
    },
    true
  );

  // Search suppliers by query
  const searchQueryResult = useSupplierSearchQuery(
    searchQuery.length >= 2 ? searchQuery : '',
    true
  );

  // Sync suppliers data
  React.useEffect(() => {
    if (suppliersQuery.data) {
      setSuppliers(suppliersQuery.data.items);
      setTotal(suppliersQuery.data.total);
    }
  }, [suppliersQuery.data]);

  // Sync search results
  React.useEffect(() => {
    if (searchQueryResult.data) {
      setSearchResults(searchQueryResult.data);
    }
  }, [searchQueryResult.data]);

  return {
    suppliers,
    total,
    searchResults,
    isLoadingSuppliers: suppliersQuery.isLoading,
    isLoadingSearch: searchQueryResult.isLoading,
    error: suppliersQuery.error?.message || null,
  };
};
