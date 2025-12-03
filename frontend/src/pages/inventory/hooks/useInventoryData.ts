/**
 * @file useInventoryData.ts
 * @module pages/inventory/hooks
 *
 * @summary
 * Centralized data fetching hooks for inventory dialog components.
 * Provides reusable React Query hooks for supplier loading, item search, and item details.
 *
 * @enterprise
 * - Consistent caching strategy across all dialogs (5min for suppliers, 30s for items)
 * - Client-side supplier filtering to work around backend limitation
 * - Performance optimized with conditional enabling
 * - Error handling with graceful fallbacks
 * - Comprehensive TypeDoc documentation for all hooks
 *
 * @backend_limitation
 * The /api/inventory search endpoint doesn't properly filter by supplierId parameter,
 * so all hooks apply client-side filtering to ensure supplier isolation.
 *
 * @usage
 * ```typescript
 * const suppliersQuery = useSuppliersQuery(dialogOpen);
 * const itemsQuery = useItemSearchQuery(selectedSupplier, searchQuery);
 * const itemDetails = useItemDetailsQuery(selectedItem?.id);
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import { getSuppliersLite } from '../../../api/analytics/suppliers';
import { searchItemsForSupplier } from '../../../api/analytics/search';
import http from '../../../api/httpClient';
import type { SupplierOption, ItemOption, ItemDetails } from '../types/inventory-dialog.types';


/**
* Helpers
*/
type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => 
  typeof value === 'object' && value !== null;

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const pickNumberField = (
  obj: UnknownRecord,
  keys: readonly string[],
): number | undefined => {
  for (const key of keys) {
    const maybe = toFiniteNumber(obj[key]);
    if (maybe !== undefined) return maybe;
  }
  return undefined;
};


/**
 * Hook to load suppliers for dropdown/autocomplete selection.
 * Caches results for 5 minutes to reduce API calls.
 * 
 * @param enabled - Whether to fetch suppliers (typically tied to dialog open state)
 * @returns React Query result with supplier options
 * 
 * @enterprise
 * - Only fetches when enabled (performance optimization)
 * - 5-minute cache reduces backend load
 * - Maps backend data to normalized SupplierOption shape
 * - Handles loading and error states automatically
 * 
 * @example
 * ```typescript
 * const { data: suppliers, isLoading } = useSuppliersQuery(dialogOpen);
 * 
 * <Select disabled={isLoading}>
 *   {suppliers?.map(s => <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>)}
 * </Select>
 * ```
 */
export function useSuppliersQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['suppliers', 'lite'],
    queryFn: async () => {
      const suppliers = await getSuppliersLite();
      return suppliers.map((supplier): SupplierOption => ({
        id: supplier.id,
        label: supplier.name,
      }));
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

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

/**
 * Hook to fetch full item details including actual current price and quantity.
 * Critical for displaying accurate values and pre-filling forms.
 * 
 * @param itemId - The unique identifier of the selected item (null/undefined if no selection)
 * @returns React Query result with complete item details or null
 * 
 * @enterprise
 * - Fetches from /api/inventory/{id} for complete item data
 * - Provides actual current price (not placeholder from search results)
 * - Provides actual current quantity for informational display
 * - Handles both 'quantity' and 'onHand' field name variations (backend inconsistency)
 * - Gracefully handles fetch errors without blocking dialog (returns null)
 * - 30-second cache for performance
 * 
 * @backend_api GET /api/inventory/{id}
 * 
 * @remarks
 * Use this hook after user selects an item to get actual current values.
 * The search results only provide placeholder values (0) for performance reasons.
 * 
 * @example
 * ```typescript
 * const { data: itemDetails, isLoading } = useItemDetailsQuery(selectedItem?.id);
 * 
 * {itemDetails && (
 *   <Typography>
 *     Current Price: ${itemDetails.price.toFixed(2)}
 *     Current Quantity: {itemDetails.onHand}
 *   </Typography>
 * )}
 * ```
 */
export function useItemDetailsQuery(itemId: string | undefined | null) {
  return useQuery({
    queryKey: ['itemDetails', itemId],
    queryFn: async (): Promise<ItemDetails | null> => {
      if (!itemId) return null;

      try {
        const response = await http.get(`/api/inventory/${encodeURIComponent(itemId)}`);
        
        // Axios response has `data`; defensively normalize it.
        const rawData = isRecord(response) && 'data' in response
          ? (response as { data: unknown }).data
          : (response as unknown);

        const data: UnknownRecord = isRecord(rawData) ? rawData : {};

        const onHand =
          pickNumberField(data, [
            'onHand',
            'quantity',
            'qty',
            'currentQuantity',
            'currentQty',
            'quantityOnHand',
            'onHandQuantity',
            'stock',
          ]) ?? 0;

        const price =
          pickNumberField(data, ['price', 'currentPrice']) ?? 0;

        const idValue = data['id'];
        const nameValue = data['name'];
        const codeValue = data['code'];
        const supplierIdValue = data['supplierId'];

        const code =
          typeof codeValue === 'string' ? codeValue : null;

        const supplierId =
          typeof supplierIdValue === 'string' || typeof supplierIdValue === 'number'
            ? supplierIdValue
            : null;

        return {
          id: String(idValue ?? ''),
          name: typeof nameValue === 'string' ? nameValue : '',
          onHand,
          price,
          code,
          supplierId,
        };
        
      } catch (error) {
        // Gracefully handle errors - don't block the dialog
        console.error('Failed to fetch item details:', error);
        return null;
      }
    },
    enabled: !!itemId,
    staleTime: 30_000, // 30 seconds cache
  });
}
