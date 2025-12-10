/**
 * @file useItemDetailsQuery.ts
 * @module api/inventory/hooks
 *
 * @summary
 * Hook to fetch full item details including actual current price and quantity.
 * Critical for displaying accurate values and pre-filling forms.
 *
 * @enterprise
 * - Fetches from /api/inventory/{id} for complete item data
 * - Handles both 'quantity' and 'onHand' field name variations
 * - Gracefully handles fetch errors without blocking dialogs
 * - 30-second cache for performance
 */

import { useQuery } from '@tanstack/react-query';
import http from '../../httpClient';
import { isRecord, pickNumberFromList } from '../utils';
import type { ItemDetails } from '../types';

/**
 * Hook to fetch full item details including actual current price and quantity.
 *
 * @param itemId - Item identifier (null/undefined if no selection)
 * @returns React Query result with complete item details or null
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

        const onHand = pickNumberFromList(data, ['onHand', 'quantity', 'qty', 'currentQuantity', 'stock']) ?? 0;
        const price = pickNumberFromList(data, ['price', 'currentPrice']) ?? 0;

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
        console.error('Failed to fetch item details:', error);
        return null;
      }
    },
    enabled: !!itemId,
    staleTime: 30_000,
  });
}
