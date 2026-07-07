/**
 * @file QuantityAdjustItemDetails.tsx
 * @module pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustItemDetails
 *
 * @summary
 * Reference panel above the quantity input: selected item name,
 * current quantity, current price, with spinners while loading.
 *
 * @enterprise
 * - Renders nothing when no item is selected (the quantity input is
 *   disabled in that state, so the panel would carry no useful
 *   information).
 * - Labels come from the 'inventory' namespace (dialogs.*Label keys);
 *   prices render via formatNumber with the user's number format and a
 *   Euro suffix, consistent with the grid columns and ItemForm.
 * - Pure presentation. All numbers come from the parent hook's
 *   effective-* derivations.
 */

import * as React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../../hooks/useSettings';
import { formatNumber } from '../../../../utils/formatters';
import type { ItemOption } from '../../../../api/analytics/types';

interface QuantityAdjustItemDetailsProps {
  item: ItemOption | null;
  currentQty: number;
  currentPrice: number | null;
  loading: boolean;
}

export const QuantityAdjustItemDetails: React.FC<QuantityAdjustItemDetailsProps> = ({
  item,
  currentQty,
  currentPrice,
  loading,
}) => {
  const { t } = useTranslation(['inventory']);
  const { userPreferences } = useSettings();

  // Only render when item is selected
  if (!item) {
    return null;
  }

  return (
    <Box sx={{ display: 'grid', gap: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
      <Typography variant="subtitle2" color="primary">
        {t('inventory:dialogs.selectedItemLabel', 'Selected Item:')} {item.name}
      </Typography>

      {/* Current Quantity */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {t('inventory:dialogs.currentQuantityLabel', 'Current Quantity:')}
        </Typography>
        <Typography variant="body2" fontWeight="medium">
          {loading ? <CircularProgress size={16} /> : currentQty}
        </Typography>
      </Box>

      {/* Current Price */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {t('inventory:dialogs.currentPriceLabel', 'Current Price:')}
        </Typography>
        <Typography variant="body2" fontWeight="medium">
          {loading ? (
            <CircularProgress size={16} />
          ) : currentPrice !== null && currentPrice !== undefined ? (
            `${formatNumber(currentPrice, userPreferences.numberFormat, 2)} €`
          ) : (
            `${formatNumber(item?.price ?? 0, userPreferences.numberFormat, 2)} €`
          )}
        </Typography>
      </Box>
    </Box>
  );
};
