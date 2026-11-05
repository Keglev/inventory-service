/**
 * @file useRefreshHandler.ts
 * @module pages/inventory/handlers/useRefreshHandler
 *
 * @summary
 * Refresh handler: the success callback shared by the five inventory mutation dialogs.
 *
 * @enterprise
 * - Refresh calls a dedicated reload function that re-runs the current
 *   inventory query directly. Resetting paginationModel to page 0 would
 *   no-op on page 0 itself (React bails on an equal setState), so the
 *   first page would never refetch.
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
