/**
 * @module api/inventory/hooks/useItemSearchQuery
 *
 * Provides a React Query hook for type-ahead item search scoped to a selected
 * supplier. Supplier isolation is enforced server-side: `GET
 * /api/inventory/search` accepts `supplierId` as a real query parameter
 * (CB-APP68), so no broad fetch or client-side re-filtering is required.
 */

import { useQuery } from '@tanstack/react-query';
import { searchItemsForSupplier } from '@/api/shared';
import type { SupplierOption, ItemOption } from '../../analytics/types';

/**
 * Type-ahead item search scoped to the selected supplier.
 *
 * Delegates to {@link searchItemsForSupplier}, which queries
 * `GET /api/inventory/search` with `name`, `supplierId`, and a result cap;
 * the backend applies the supplier filter, so the returned rows are already
 * scoped.
 *
 * Returned `ItemOption` objects carry only `id` and `name`; `onHand` and
 * `price` are absent. Fetch the full record with `useItemDetailsQuery()` when
 * the user selects an item.
 *
 * @param selectedSupplier - Supplier to scope results to; the query is
 *   disabled until a supplier is set to prevent cross-supplier data leakage.
 * @param searchQuery - User input; the query is disabled until at least 2
 *   characters are present to avoid a burst of requests on the first keystroke.
 * @returns React Query result whose `data` is an `ItemOption[]` scoped to the
 *   selected supplier.
 */
export function useItemSearchQuery(
  selectedSupplier: SupplierOption | null,
  searchQuery: string
) {
  return useQuery({
    // Keyed by supplier + search text so each (supplier, query) pair has its
    // own cache entry; stale entries are never served cross-supplier.
    queryKey: ['inventory', 'search', selectedSupplier?.id, searchQuery],
    queryFn: async () => {
      if (!selectedSupplier) return [];

      // Supplier scoping is a backend query parameter; 50 results is ample
      // for a type-ahead dropdown.
      const items = await searchItemsForSupplier(
        String(selectedSupplier.id),
        searchQuery,
        50
      );

      // Only id and name are returned here; onHand and price are absent.
      // Full details are fetched lazily via useItemDetailsQuery on selection.
      return items.map((item): ItemOption => ({
        id: item.id,
        name: item.name,
      }));
    },
    // Both conditions must hold to prevent premature or cross-supplier fetches:
    // supplier must be selected (supplier isolation) and query must be ≥2 chars
    // (avoids high-frequency requests on the first keystroke of a type-ahead).
    enabled: !!selectedSupplier && searchQuery.length >= 2,
    staleTime: 30_000,
  });
}
