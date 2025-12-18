/**
 * @file useFilterHandlers.ts
 * @module pages/suppliers/handlers/useFilterHandlers
 *
 * @summary
 * Custom hook that provides filter panel event handlers for SuppliersBoard.
 * Manages: Show all suppliers toggle change.
 *
 * @enterprise
 * - Separation of concerns: handler logic isolated from component
 * - Clean orchestrator interface
 */

import { useCallback } from 'react';
import type { UseSuppliersBoardStateReturn } from '../hooks/useSuppliersBoardState';

/**
 * Hook providing filter panel handlers.
 *
 * @param state - Suppliers board state object from useSuppliersBoardState
 * @returns Object with handler functions for filter actions
 *
 * @example
 * ```tsx
 * const { handleToggleShowAll } = useFilterHandlers(state);
 * ```
 */
export function useFilterHandlers(state: UseSuppliersBoardStateReturn) {
  const handleToggleShowAll = useCallback(
    (show: boolean) => {
      state.setShowAllSuppliers(show);
    },
    [state.setShowAllSuppliers]
  );

  return {
    handleToggleShowAll,
  };
}
