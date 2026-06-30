/**
 * @file useRefreshHandler.ts
 * @module pages/inventory/handlers/useRefreshHandler
 *
 * @summary
 * Refresh handler for the inventory board's reload button.
 *
 * @enterprise
 * - Refresh triggers a refetch by mutating paginationModel back to
 *   page 0. This relies on useInventoryPageData's effect dependency on
 *   serverPage to re-fire the load. Tracked under CB-APP46: when the
 *   user is already on page 0, paginationModel does not actually
 *   change (React bails out on the setter), so the refresh button is
 *   a no-op on the first page. The proper fix is a dedicated
 *   invalidation path (e.g. a refetch ref or a query-cache invalidation)
 *   rather than piggy-backing on pagination.
 * - pageSize is preserved across the reset so the user's row-density
 *   preference survives the refresh.
 */

import { useCallback } from 'react';
import type { InventoryState, InventoryStateSetters } from '../hooks/useInventoryState';

type InventoryStateReturn = InventoryState & InventoryStateSetters;

/**
 * Hook providing data refresh handler.
 *
 * Triggers data reload by resetting pagination to first page.
 * This causes useInventoryPageData to refetch data.
 *
 * @param state - Inventory board state object
 * @returns Object with handler function for refresh action
 */
export function useRefreshHandler(state: InventoryStateReturn) {
  const handleReload = useCallback(() => {
    // Trigger data reload by resetting pagination
    // Since hooks can't be called conditionally, reload happens via dependency changes
    // Force reload by resetting pagination to first page
    // BUCKET: CB-APP46 -- no-op on page 0. React bails out when the new state equals the current state, so the refetch never fires.
    state.setPaginationModel({ page: 0, pageSize: state.paginationModel.pageSize });
  }, [state]);

  return {
    handleReload,
  };
}
