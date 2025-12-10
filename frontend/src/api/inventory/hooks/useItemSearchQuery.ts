/**
 * @file useItemSearchQuery.ts
 * @module api/inventory/hooks
 *
 * @summary
 * Hook to search items with supplier-scoped filtering and type-ahead.
 * Applies client-side filtering due to backend limitation.
 *
 * @enterprise
 * - Requires supplier selection first (prevents cross-supplier errors)
 * - Minimum 2 characters to trigger search (reduces API load)
 * - **Client-side supplier filtering** (backend doesn't filter properly)
 * - Returns placeholder price/quantity (actual values fetched on selection)
 * - 30-second cache improves UX during selection
 *
 * @backend_limitation
 * The /api/inventory search endpoint doesn't properly filter by supplierId parameter,
 * so this hook applies client-side filtering to ensure supplier isolation.
 */

import { useQuery } from '@tanstack/react-query';
import { searchItemsForSupplier } from '../../analytics/search';
import type { SupplierOption, ItemOption } from '../../analytics/types';

/**
 * Hook to search items with supplier-scoped filtering and type-ahead search.
 * Applies client-side supplier filtering due to backend limitation.
 *
 * @param selectedSupplier - Currently selected supplier (required for filtering)
 * @param searchQuery - User's search query (minimum 2 characters to trigger search)
 * @returns React Query result with filtered item options
 *
 * @enterprise
 * - Requires supplier selection first (prevents cross-supplier errors)
 * - Minimum 2 characters to trigger search (reduces API load)
 * - **Client-side supplier filtering** (backend doesn't filter properly)
 * - Returns placeholder price/quantity (actual values fetched on selection)
 * - 30-second cache improves UX during selection
 *
 * @backend_limitation
 * Backend /api/inventory endpoint ignores supplierId parameter, so we:
 * 1. Fetch up to 500 items from backend
 * 2. Apply client-side filtering: `item.supplierId === selectedSupplier.id`
 * 3. Return only items belonging to selected supplier
 *
 * @remarks
 * The returned `ItemOption` objects have placeholder values (0) for `onHand` and `price`.
 * Fetch full details using `useItemDetailsQuery()` when user selects an item.
 *
 * @example
 * ```typescript
 * const { data: items, isLoading } = useItemSearchQuery(selectedSupplier, "widget");
 *
 * <Autocomplete
 *   options={items || []}
 *   loading={isLoading}
 *   getOptionLabel={(opt) => opt.name}
 * />
 * ```
 */
export function useItemSearchQuery(
  selectedSupplier: SupplierOption | null,
  searchQuery: string
) {
  return useQuery({
    queryKey: ['inventory', 'search', selectedSupplier?.id, searchQuery],
    queryFn: async () => {
      if (!selectedSupplier) return [];

      // Fetch items from backend (may include cross-supplier results due to backend bug)
      const items = await searchItemsForSupplier(
        String(selectedSupplier.id),
        searchQuery,
        500 // Fetch more items since we'll filter client-side
      );

      // CRITICAL: Apply client-side supplier filtering (backend doesn't filter properly)
      // This ensures only items belonging to the selected supplier are returned
      const supplierIdStr = String(selectedSupplier.id);
      const supplierFiltered = items.filter(
        (item) => String(item.supplierId ?? '') === supplierIdStr
      );

      // Map to ItemOption with placeholder values (full details fetched on selection)
      return supplierFiltered.map((item): ItemOption => ({
        id: item.id,
        name: item.name,
      }));
    },
    enabled: !!selectedSupplier && searchQuery.length >= 2,
    staleTime: 30_000, // 30 seconds cache
  });
}
