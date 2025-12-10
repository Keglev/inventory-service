/**
 * useDeleteItemQueries - Data query coordination
 *
 * Manages: supplier list query, item search query, item details query
 * Responsibility: React Query orchestration with smart dependencies
 * Pattern: Queries only fire when parent state requires them
 */

import type { SupplierOption } from '../../../../api/analytics/types';
import {
  useSuppliersQuery,
  useItemSearchQuery,
  useItemDetailsQuery,
} from '../../../../api/inventory/hooks/useInventoryData';

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
