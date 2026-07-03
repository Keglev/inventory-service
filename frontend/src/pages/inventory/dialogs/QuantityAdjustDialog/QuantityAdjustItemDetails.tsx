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
 * - Three hardcoded English strings ('Selected Item:', 'Current
 *   Quantity:', 'Current Price:') bypass t() and ship as-is to
 *   German users. The currency symbol is hardcoded '$' while the rest
 *   of the app uses Euro (see ItemForm.tsx price field). Tracked under
 *   CB-APP59 -- thread useTranslation, add the three keys to
 *   inventory.json, replace '$' with the locale-aware currency
 *   formatter from utils/formatters.
 * - Pure presentation. All numbers come from the parent hook's
 *   effective-* derivations.
 */

import * as React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
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
  // Only render when item is selected
  if (!item) {
    return null;
  }

  return (
    <Box sx={{ display: 'grid', gap: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
      {/* BUCKET: CB-APP59 -- hardcoded English strings + '$' currency in Euro app. Thread useTranslation and use locale-aware currency formatter. */}
      <Typography variant="subtitle2" color="primary">
        Selected Item: {item.name}
      </Typography>

      {/* Current Quantity */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          Current Quantity:
        </Typography>
        <Typography variant="body2" fontWeight="medium">
          {loading ? <CircularProgress size={16} /> : currentQty}
        </Typography>
      </Box>

      {/* Current Price */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          Current Price:
        </Typography>
        <Typography variant="body2" fontWeight="medium">
          {loading ? (
            <CircularProgress size={16} />
          ) : currentPrice !== null && currentPrice !== undefined ? (
            `$${currentPrice.toFixed(2)}`
          ) : (
            `$${(item?.price ?? 0).toFixed(2)}`
          )}
        </Typography>
      </Box>
    </Box>
  );
};
