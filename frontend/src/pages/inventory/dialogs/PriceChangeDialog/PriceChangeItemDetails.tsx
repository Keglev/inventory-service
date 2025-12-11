/**
 * PriceChangeItemDetails - Selected item details panel component
 * 
 * @module dialogs/PriceChangeDialog/PriceChangeItemDetails
 * @description
 * Displays current price and quantity for selected item in a highlighted panel.
 * Only renders when an item is selected.
 */

import { Box, Typography, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { ItemOption } from '../../../../api/analytics/types';

/**
 * PriceChangeItemDetails - Render selected item details
 * 
 * @param item - Currently selected item
 * @param currentPrice - Current item price (from API)
 * @param currentQty - Current item quantity (from API)
 * @param loading - Whether details are still loading
 */
export function PriceChangeItemDetails({
  item,
  currentPrice,
  currentQty,
  loading,
}: {
  item: ItemOption | null;
  currentPrice: number;
  currentQty: number;
  loading: boolean;
}) {
  const { t } = useTranslation(['inventory']);

  if (!item) return null;

  return (
    <Box sx={{ display: 'grid', gap: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
      <Typography variant="subtitle2" color="primary">
        {t('inventory:selection.selectedItemLabel', 'Selected Item')}: {item.name}
      </Typography>

      {/* Current Price */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {t('inventory:price.currentPrice', 'Current Price')}:
        </Typography>
        <Typography variant="body2" fontWeight="medium">
          {loading ? <CircularProgress size={16} /> : currentPrice.toFixed(2)}
        </Typography>
      </Box>

      {/* Current Quantity */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {t('inventory:quantity.currentQuantity', 'Current Quantity')}:
        </Typography>
        <Typography variant="body2" fontWeight="medium">
          {loading ? <CircularProgress size={16} /> : currentQty}
        </Typography>
      </Box>
    </Box>
  );
}
