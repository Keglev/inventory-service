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
 * - Exists because the inventory item details endpoint does not
 *   guarantee a current price -- the analytics price trend is the
 *   authoritative source for the most recent observed price. The
 *   selectedItem.price fallback handles the empty-trend case.
 * - 30-second staleTime keeps re-mounts cheap during a dialog session
 *   while still picking up fresh prices on a longer browsing window.
 * - Exported through the QuantityAdjustDialog barrel because the
 *   price-trend lookup is generic and reusable outside this dialog.
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
