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
 *   predicate: suppliers fires when the dialog opens; the supplier's
 *   item list loads once when a supplier is selected (typing is matched
 *   in the browser); item details fires only when an item is picked.
 * - This file does not transport data itself; it only coordinates which
 *   queries are active. Keeps the orchestrator hook thin and the query
 *   layer testable in isolation.
 */

import type { SupplierOption } from '../../../../api/analytics/types';
import { useSuppliersQuery } from '../../../../api/inventory/hooks/useSuppliersQuery';
import { useItemSearchQuery } from '../../../../api/inventory/hooks/useItemSearchQuery';
import { useItemDetailsQuery } from '../../../../api/inventory/hooks/useItemDetailsQuery';

export function useDeleteItemQueries(
  dialogOpen: boolean,
  selectedSupplier: SupplierOption | null,
  itemQuery: string,
  selectedItemId?: string
) {
  const suppliersQuery = useSuppliersQuery(dialogOpen);

  const itemsQuery = useItemSearchQuery(selectedSupplier, itemQuery);

  const itemDetailsQuery = useItemDetailsQuery(selectedItemId);

  return {
    suppliersQuery,
    itemsQuery,
    itemDetailsQuery,
  };
}

export type UseDeleteItemQueriesReturn = ReturnType<typeof useDeleteItemQueries>;
