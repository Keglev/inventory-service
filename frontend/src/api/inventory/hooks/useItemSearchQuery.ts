/**
 * @module api/inventory/hooks/useItemSearchQuery
 *
 * Provides a React Query hook for type-ahead item search scoped to a selected
 * supplier. The backend's `GET /api/inventory` does not reliably honour
 * `supplierId` as a search-time filter (the dedicated `GET /api/inventory/search`
 * endpoint accepts only `name` with no `supplierId` parameter at all), so
 * results must be filtered client-side to enforce supplier isolation.
 */

import { useQuery } from '@tanstack/react-query';
import { searchItemsForSupplier } from '@/api/shared';
import type { SupplierOption, ItemOption } from '../../analytics/types';

/**
 * Type-ahead item search scoped to the selected supplier.
 *
 * Fetches up to 500 candidates from `GET /api/inventory` via
 * {@link searchItemsForSupplier}, then applies a client-side filter to remove
 * items belonging to other suppliers. The backend does not reliably honour
 * `supplierId` as a search-time filter; the dedicated
 * `GET /api/inventory/search` endpoint accepts only `name` with no `supplierId`
 * support at all. The client-side filter is therefore load-bearing and must
 * not be removed.
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
 *
 * @example
 * ```typescript
 * const { data: items, isLoading } = useItemSearchQuery(selectedSupplier, "widget");
 * ```
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

      // Fetch a broad result set (500) because the backend does not reliably
      // scope results by supplier; client-side filtering below is the real gate.
      const items = await searchItemsForSupplier(
        String(selectedSupplier.id),
        searchQuery,
        500
      );

      // Client-side supplier gate: GET /api/inventory does not reliably scope
      // search results to supplierId. The dedicated GET /api/inventory/search
      // accepts only `name` with no supplierId parameter. This filter is the
      // authoritative enforcement and must stay.
      const supplierIdStr = String(selectedSupplier.id);
      const supplierFiltered = items.filter(
        (item) => String(item.supplierId ?? '') === supplierIdStr
      );

      // Only id and name are returned here; onHand and price are absent.
      // Full details are fetched lazily via useItemDetailsQuery on selection.
      return supplierFiltered.map((item): ItemOption => ({
        id: item.id,
        name: item.name,
      }));
    },
    // Both conditions must hold to prevent premature or cross-supplier fetches:
    // supplier must be selected (supplier isolation) and query must be ≥2 chars
    // (avoids high-frequency requests on the first keystroke of a type-ahead).
    enabled: !!selectedSupplier && searchQuery.length >= 2,
    // 30 s keeps repeated identical searches within a single session fast
    // without letting stale inventory data persist across meaningful user pauses.
    staleTime: 30_000,
  });
}
