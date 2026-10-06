/**
 * @file useSupplierSearch.ts
 * @module pages/suppliers/hooks/useSupplierSearch
 *
 * @summary
 * Search state for the edit and delete supplier dialogs.
 *
 * @enterprise
 * - Owns only the typed text. Results are matched in the browser against the
 *   full supplier list (useSupplierListQuery, one cached request), so typing
 *   sends no request (frontend ADR-0014). The board uses the same list and
 *   the same matchSuppliers rule.
 * - searchLoading is true only while that list loads for the first time.
 */

import * as React from 'react';
import { useSupplierListQuery } from '../../../api/suppliers/hooks/useSupplierListQuery';
import type { SupplierRow } from '../../../api/suppliers/types';
import { matchSuppliers } from '../utils/matchSuppliers';

/**
 * Hook return type for supplier search.
 *
 * @interface UseSupplierSearchReturn
 */
export interface UseSupplierSearchReturn {
  /** Current search text */
  searchQuery: string;
  /** Suppliers matching the search text */
  searchResults: SupplierRow[];
  /** Whether the supplier list is still loading */
  searchLoading: boolean;
  /** Sets the search text */
  handleSearchQueryChange: (query: string) => void;
  /** Clears the search text */
  resetSearch: () => void;
}

/**
 * Hook for supplier search in the dialogs.
 *
 * @returns Search text, matching suppliers and handlers
 *
 * @example
 * ```ts
 * const { searchQuery, searchResults, handleSearchQueryChange } = useSupplierSearch();
 * ```
 */
export const useSupplierSearch = (): UseSupplierSearchReturn => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const listQuery = useSupplierListQuery();

  const searchResults = React.useMemo(
    () => matchSuppliers(listQuery.data ?? [], searchQuery),
    [listQuery.data, searchQuery]
  );

  const resetSearch = React.useCallback(() => setSearchQuery(''), []);

  return {
    searchQuery,
    searchResults,
    searchLoading: listQuery.isLoading,
    handleSearchQueryChange: setSearchQuery,
    resetSearch,
  };
};
