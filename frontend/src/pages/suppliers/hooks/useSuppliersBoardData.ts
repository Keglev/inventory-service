/**
 * @file useSuppliersBoardData.ts
 * @module pages/suppliers/hooks/useSuppliersBoardData
 *
 * @summary
 * Data fetching and processing for the suppliers board page.
 * Wires React Query for the suppliers list; the name search matches in it.
 *
 * @enterprise
 * - The list query (useSupplierListQuery -> GET /api/suppliers) returns every
 *   supplier; the backend does not paginate, sort or filter, so the grid does that
 *   in the browser. The name search matches against the same list
 *   (matchSuppliers), so typing sends no request (frontend ADR-0014).
 * - Loading and error states; type-safe data transformations.
 */

import * as React from 'react';
import { useSupplierListQuery } from '../../../api/suppliers/hooks/useSupplierListQuery';
import type { SupplierRow } from '../../../api/suppliers/types';
import { matchSuppliers } from '../utils/matchSuppliers';

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
 * - Suppliers matching the search text, matched in the browser
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
  // One fetch serves every page, sort order and search: the endpoint returns
  // the full list.
  const suppliersQuery = useSupplierListQuery();

  // Memoize the return object to keep a stable reference across renders and avoid
  // re-render loops that would otherwise churn router updates.
  return React.useMemo(
    () => {
      return {
        suppliers: suppliersQuery.data ?? [],
        searchResults: matchSuppliers(suppliersQuery.data ?? [], searchQuery),
        isLoadingSuppliers: suppliersQuery.isLoading,
        isLoadingSearch: suppliersQuery.isLoading,
        error: suppliersQuery.error?.message || null,
      };
    },
    [
      suppliersQuery.data,
      searchQuery,
      suppliersQuery.isLoading,
      suppliersQuery.error?.message,
    ]
  );
};
