/**
 * @file useRefreshHandler.ts
 * @module pages/inventory/handlers/useRefreshHandler
 *
 * @summary
 * Custom hook that provides data refresh handler for InventoryBoard.
 * Manages: Reload data by resetting pagination.
 *
 * @enterprise
 * - Separation of concerns: handler logic isolated from component
 * - Single responsibility: triggers data reload via state changes
 */

import { useCallback } from 'react';
import type { InventoryState, InventoryStateSetters } from '../hooks/useInventoryState';

type InventoryStateReturn = InventoryState & InventoryStateSetters;

/**
 * Hook providing data refresh handler.
 *
 * Triggers data reload by resetting pagination to first page.
 * This causes useInventoryData to refetch data.
 *
 * @param state - Inventory board state object
 * @returns Object with handler function for refresh action
 *
 * @example
 * ```tsx
 * const { handleReload } = useRefreshHandler(state);
 * ```
 */
export function useRefreshHandler(state: InventoryStateReturn) {
  const handleReload = useCallback(() => {
    // Trigger data reload by resetting pagination
    // Since hooks can't be called conditionally, reload happens via dependency changes
    // Force reload by resetting pagination to first page
    state.setPaginationModel({ page: 0, pageSize: state.paginationModel.pageSize });
  }, [state]);

  return {
    handleReload,
  };
}
