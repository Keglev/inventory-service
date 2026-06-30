/**
 * @file useDeleteItemQueries.ts
 * @module pages/inventory/dialogs/DeleteItemDialog/useDeleteItemQueries
 *
 * @summary
 * Composes the three React Query hooks the delete flow needs: suppliers,
 * item search, and item details.
 *
 * @enterprise
 * - Lazy firing by design. Each underlying hook owns its own enable
 *   predicate: suppliers fires when the dialog opens; item search fires
 *   when a supplier is selected and the query is long enough; item
 *   details fires only when an item is picked.
 * - This file does not transport data itself; it only coordinates which
 *   queries are active. Keeps the orchestrator hook thin and the query
 *   layer testable in isolation.
 */

import type { SupplierOption } from '../../../../api/analytics/types';
import {
  useSuppliersQuery,
  useItemSearchQuery,
  useItemDetailsQuery,
} from '../../../../api/inventory/hooks';

export function useDeleteItemQueries(
  dialogOpen: boolean,
  selectedSupplier: SupplierOption | null,
  itemQuery: string,
  selectedItemId?: string
) {
  /**
   * Suppliers query
   * Fires: when dialog opens
   * Caches: globally across component tree via React Query
   * Returns: loading state, error, and supplier list with id/label
   */
  const suppliersQuery = useSuppliersQuery(dialogOpen);

  /**
   * Items search query
   * Fires: only when supplier is selected AND query has 2+ characters
   * Dependency: selectedSupplier ensures we filter by supplier context
   * Returns: filtered items matching search, loading state during fetch
   */
  const itemsQuery = useItemSearchQuery(selectedSupplier, itemQuery);

  /**
   * Item details query
   * Fires: only when specific item is selected
   * Dependency: selectedItemId (item.id) to fetch detailed data
   * Returns: name, onHand quantity, and other item details for preview
   */
  const itemDetailsQuery = useItemDetailsQuery(selectedItemId);

  return {
    suppliersQuery,
    itemsQuery,
    itemDetailsQuery,
  };
}

export type UseDeleteItemQueriesReturn = ReturnType<typeof useDeleteItemQueries>;
