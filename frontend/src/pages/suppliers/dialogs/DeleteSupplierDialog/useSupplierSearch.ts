/**
 * @file useSupplierSearch.ts
 * @module dialogs/DeleteSupplierDialog/useSupplierSearch
 *
 * @summary
 * Hook for supplier search functionality.
 * Handles search query, results, and loading state.
 *
 * @enterprise
 * - Encapsulates all search-related logic
 * - Reusable for other supplier search scenarios
 * - Minimum 2 characters required for API call
 */

import * as React from 'react';
import { getSuppliersPage } from '../../../../api/suppliers';
import type { SupplierRow } from '../../../../api/suppliers/types';

/**
 * Hook return type for supplier search.
 * 
 * @interface UseSupplierSearchReturn
 */
export interface UseSupplierSearchReturn {
  /** Current search query */
  searchQuery: string;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Search results */
  searchResults: SupplierRow[];
  /** Whether search is currently loading */
  searchLoading: boolean;
  /** Handle search query change with debouncing */
  handleSearchQueryChange: (query: string) => Promise<void>;
  /** Reset search to initial state */
  resetSearch: () => void;
}

/**
 * Hook for supplier search functionality.
 *
 * Manages:
 * - Search query state
 * - Search results from API
 * - Loading state during API calls
 * - Minimum character validation (2 chars)
 *
 * @returns Search state and handlers
 *
 * @example
 * ```ts
 * const { searchQuery, searchResults, handleSearchQueryChange } = useSupplierSearch();
 * ```
 */
export const useSupplierSearch = (): UseSupplierSearchReturn => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SupplierRow[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);

  /**
   * Search for suppliers by name.
   * Requires minimum 2 characters.
   * Clears results if query is too short.
   */
  const handleSearchQueryChange = React.useCallback(async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await getSuppliersPage({ page: 1, pageSize: 10, q: query });
      setSearchResults(response.items);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  /**
   * Reset search to initial state.
   */
  const resetSearch = React.useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    handleSearchQueryChange,
    resetSearch,
  };
};
