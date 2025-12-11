/**
 * @file useItemPriceQuery.ts
 * @module dialogs/QuantityAdjustDialog/useItemPriceQuery
 *
 * @summary
 * Specialized hook for fetching item price from analytics API.
 * Isolates price trend logic from form state.
 *
 * @enterprise
 * - Extracts price query into focused hook for single responsibility
 * - Handles price trend API calls and fallback logic
 * - Provides loading state for async operations
 */

import { useQuery } from '@tanstack/react-query';
import { getPriceTrend } from '../../../../api/analytics/priceTrend';
import type { ItemOption } from '../../../../api/analytics/types';

/**
 * Hook for fetching and caching item price from analytics API.
 * 
 * Features:
 * - Fetches most recent price from price trend data
 * - Falls back to item's listed price if trend unavailable
 * - Caches results for 30 seconds
 * - Only queries when item is selected
 * 
 * @param selectedItem - Currently selected item (null if not selected)
 * @param selectedSupplierId - Optional supplier ID for price filtering
 * @returns Query result with price value and loading state
 * 
 * @example
 * ```ts
 * const priceQuery = useItemPriceQuery(selectedItem, selectedSupplier?.id);
 * return <div>{priceQuery.data?.toFixed(2) || 'Loading...'}</div>;
 * ```
 */
export const useItemPriceQuery = (
  selectedItem: ItemOption | null,
  selectedSupplierId?: string | number
) => {
  return useQuery({
    queryKey: ['itemPrice', selectedItem?.id],
    queryFn: async () => {
      if (!selectedItem?.id) return null;

      try {
        // Get recent price trend to find the most current price
        const pricePoints = await getPriceTrend(selectedItem.id, {
          supplierId: selectedSupplierId ? String(selectedSupplierId) : undefined,
        });

        // Return the most recent price, or fall back to item's current price
        if (pricePoints.length > 0) {
          const latestPrice = pricePoints[pricePoints.length - 1];
          return latestPrice.price;
        }

        return selectedItem.price;
      } catch (error) {
        console.error('Failed to fetch item price:', error);
        return selectedItem.price;
      }
    },
    enabled: !!selectedItem?.id,
    staleTime: 30_000,
  });
};
