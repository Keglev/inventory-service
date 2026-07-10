/**
 * @file useItemDetailsQuery.ts
 * @module api/inventory/hooks
 *
 * Fetches complete item data from GET /api/inventory/{id}.
 * Used to pre-fill edit forms with accurate current price and stock level, because
 * list/search responses carry placeholder values only.
 * Errors are swallowed (returns null) so that missing details don't block dialog open.
 */

import { useQuery } from '@tanstack/react-query';
import http from '../../httpClient';
import { isRecord } from '../../shared/typeGuards';
import { pickNumber } from '../../shared/fieldPickers';
import type { ItemDetails } from '../types';
import { logError } from '../../../utils/logger';

/**
 * Fetches full details for a single inventory item by ID.
 *
 * Disabled until `itemId` is truthy — prevents a fetch with a null/undefined key.
 * 30 s stale time keeps data fresh during a typical edit session while avoiding
 * redundant re-fetches if the user reopens the same item shortly after.
 *
 * The backend (InventoryItemDTO) sends the stock quantity as `quantity` and the
 * price as `price`.
 *
 * @param itemId - ID of the item to fetch; pass null or undefined when no item is selected
 * @returns React Query result with normalized {@link ItemDetails}, or null on error / no selection
 *
 * @example
 * ```typescript
 * const { data: itemDetails } = useItemDetailsQuery(selectedItem?.id);
 * ```
 */
export function useItemDetailsQuery(itemId: string | undefined | null) {
  return useQuery({
    queryKey: ['itemDetails', itemId],
    queryFn: async (): Promise<ItemDetails | null> => {
      if (!itemId) return null;

      try {
        const response = await http.get(`/api/inventory/${encodeURIComponent(itemId)}`);
        const data: Record<string, unknown> = isRecord(response) && 'data' in response
          ? (response as { data: unknown }).data as Record<string, unknown>
          : isRecord(response) ? response : {};

        const onHand = pickNumber(data, 'quantity') ?? 0;
        const price = pickNumber(data, 'price') ?? 0;

        return {
          id: String(data['id'] ?? ''),
          name: typeof data['name'] === 'string' ? data['name'] : '',
          onHand,
          price,
          code: typeof data['code'] === 'string' ? data['code'] : null,
          supplierId: typeof data['supplierId'] === 'string' || typeof data['supplierId'] === 'number'
            ? data['supplierId']
            : null,
        };
      } catch (error) {
        logError('Failed to fetch item details:', error);
        return null;
      }
    },
    enabled: !!itemId,
    staleTime: 30_000,
  });
}
