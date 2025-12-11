/**
 * @file useSearchHandlers.ts
 * @module pages/suppliers/handlers/useSearchHandlers
 *
 * @summary
 * Custom hook that provides search panel event handlers for SuppliersBoard.
 * Manages: Search input change, result selection, clear selection.
 *
 * @enterprise
 * - Separation of concerns: handler logic isolated from component
 * - Clean orchestrator interface
 */

import { useCallback } from 'react';
import type { SupplierRow } from '../../../api/suppliers';
import type { UseSuppliersBoardStateReturn } from '../hooks/useSuppliersBoardState';

/**
 * Hook providing search panel handlers.
 *
 * @param state - Suppliers board state object from useSuppliersBoardState
 * @returns Object with handler functions for search actions
 *
 * @example
 * ```tsx
 * const { handleSearchChange, handleSearchResultSelect, handleClearSearchSelection } = useSearchHandlers(state);
 * ```
 */
export function useSearchHandlers(state: UseSuppliersBoardStateReturn) {
  const handleSearchChange = useCallback(
    (query: string) => {
      state.setSearchQuery(query);
      // Reset selection and jump back to first page when search text changes
      state.setSelectedSearchResult(null);
      state.setSelectedId(null);
      state.setPaginationModel({ ...state.paginationModel, page: 0 });
      state.setShowAllSuppliers(true);
    },
    [state]
  );

  const handleSearchResultSelect = useCallback(
    (supplier: SupplierRow) => {
      state.setSelectedSearchResult(supplier);
      state.setSelectedId(supplier.id);
      state.setShowAllSuppliers(true);
      state.setPaginationModel({ ...state.paginationModel, page: 0 });
      state.setSearchQuery(supplier.name ?? '');
    },
    [state]
  );

  const handleClearSearchSelection = useCallback(() => {
    state.setSelectedSearchResult(null);
    state.setSelectedId(null);
    state.setSearchQuery('');
    state.setShowAllSuppliers(true);
  }, [state]);

  return {
    handleSearchChange,
    handleSearchResultSelect,
    handleClearSearchSelection,
  };
}
