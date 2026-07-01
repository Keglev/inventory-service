/**
 * @file useRefreshHandler.ts
 * @module pages/inventory/handlers/useRefreshHandler
 *
 * @summary
 * Refresh handler for the inventory board's reload button and for the
 * success callback shared by all six inventory mutation dialogs.
 *
 * @enterprise
 * - Refresh calls a dedicated reload function that re-runs the current
 *   inventory query directly. It no longer pokes paginationModel back to
 *   page 0: that approach silently no-opped when the user was already on
 *   page 0 (React bails on an equal setState), so the refresh button and
 *   every mutation-success callback failed to refetch on the first page.
 * - The reload preserves the user's current page, page size, and filters,
 *   so a mutation refetches the view the user is looking at rather than
 *   jumping them back to the first page.
 */

import { useCallback } from 'react';

/**
 * Hook providing the data refresh handler.
 *
 * @param reload - Refetch function from the data-fetching hook that re-runs
 *   the current inventory query.
 * @returns Object with the handler function for the refresh action.
 */
export function useRefreshHandler(reload: () => void) {
  const handleReload = useCallback(() => {
    reload();
  }, [reload]);

  return {
    handleReload,
  };
}
