/**
 * @file useSupplierSearch.ts
 * @module pages/suppliers/hooks/useSupplierSearch
 *
 * @summary
 * Hook for supplier search functionality.
 * Handles search query, results, and loading state.
 *
 * @enterprise
 * - Thin stateful adapter over useSupplierSearchQuery — the single supplier-search
 *   implementation (GET /api/suppliers/search). This hook owns only the query
 *   string; results, loading, the >= 2-char gating, caching, and error handling
 *   all live in useSupplierSearchQuery.
 * - Preserves the imperative { searchQuery, setSearchQuery, searchResults,
 *   searchLoading, handleSearchQueryChange, resetSearch } shape the Edit/Delete
 *   supplier dialogs consume.
 */

import * as React from 'react';
import { useSupplierSearchQuery } from '../../../api/suppliers';
import type { SupplierRow } from '../../../api/suppliers/types';

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

  // Delegate fetching, the >= 2-char gating, caching, and error handling to the
  // single supplier-search implementation (GET /api/suppliers/search). This hook
  // owns only the query string; results are derived reactively.
  const { data, isFetching } = useSupplierSearchQuery(searchQuery);
  const searchResults: SupplierRow[] = data ?? [];

  // Kept async (Promise<void>) so the dialogs' consuming signature is unchanged.
  const handleSearchQueryChange = React.useCallback(async (query: string) => {
    setSearchQuery(query);
  }, []);

  const resetSearch = React.useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading: isFetching,
    handleSearchQueryChange,
    resetSearch,
  };
};
