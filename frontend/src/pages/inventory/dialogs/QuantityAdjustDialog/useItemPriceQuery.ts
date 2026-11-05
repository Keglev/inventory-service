/**
 * @file useItemPriceQuery.ts
 * @module pages/inventory/dialogs/QuantityAdjustDialog/useItemPriceQuery
 *
 * @summary
 * Specialized React Query hook that fetches the most recent price for
 * an item via the analytics price-trend endpoint, with a fallback to
 * the item's own price field.
 *
 * @enterprise
 * - Reads the latest price-trend point; the selectedItem.price fallback
 *   handles the empty-trend case. The item details endpoint returns the
 *   price as well (InventoryItemDTO.price).
 * - 30-second staleTime keeps re-mounts cheap during a dialog session
 *   while still picking up fresh prices on a longer browsing window.
 * - Its one consumer is useQuantityAdjustFormQueries.
 */

import { useQuery } from '@tanstack/react-query';
import { getPriceTrend } from '../../../../api/analytics/priceTrend';
import type { ItemOption } from '../../../../api/analytics/types';
import { logError } from '../../../../utils/logger';

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
        logError('Failed to fetch item price:', error);
        return selectedItem.price;
      }
    },
    enabled: !!selectedItem?.id,
    staleTime: 30_000,
  });
};
