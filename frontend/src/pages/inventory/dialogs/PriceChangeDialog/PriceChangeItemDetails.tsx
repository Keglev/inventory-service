/**
 * @file PriceChangeItemDetails.tsx
 * @module pages/inventory/dialogs/PriceChangeDialog/PriceChangeItemDetails
 *
 * @summary
 * Reference panel rendered above the new-price input: shows the selected
 * item's name, current price, and current on-hand quantity, with skeleton
 * spinners while the details query is loading.
 *
 * @enterprise
 * - Renders nothing when no item is selected, by design. The new-price
 *   input is disabled in that state, so the panel would carry no useful
 *   information.
 * - Pure presentation. All numbers come from the parent hook's
 *   effective-* derivations, so backend-shape drift is absorbed upstream
 *   not here.
 */

import { Box, Typography, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { ItemOption } from '../../../../api/analytics/types';

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
    <Box sx={{ display: 'grid', gap: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
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

      {/* Current Total Value = unit price x quantity */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {t('inventory:price.currentTotalValue', 'Current Total Value')}:
        </Typography>
        <Typography variant="body2" fontWeight="medium">
          {loading ? <CircularProgress size={16} /> : (currentPrice * currentQty).toFixed(2)}
        </Typography>
      </Box>
    </Box>
  );
}
