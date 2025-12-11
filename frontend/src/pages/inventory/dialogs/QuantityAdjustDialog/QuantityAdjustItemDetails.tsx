/**
 * @file QuantityAdjustItemDetails.tsx
 * @module dialogs/QuantityAdjustDialog/QuantityAdjustItemDetails
 *
 * @summary
 * Specialized component displaying current item details.
 * Shows selected item name, current quantity, and current price in a formatted panel.
 *
 * @enterprise
 * - Isolated component for single responsibility
 * - Only renders when item is selected (conditional)
 * - Accepts state as object for cleaner prop drilling
 * - Handles loading states elegantly
 */

import * as React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import type { ItemOption } from '../../../../api/analytics/types';

/**
 * Props for QuantityAdjustItemDetails component.
 * 
 * @interface QuantityAdjustItemDetailsProps
 * @property {ItemOption | null} item - Selected item (null if not selected)
 * @property {number} currentQty - Current item quantity
 * @property {number | null} currentPrice - Current item price
 * @property {boolean} loading - Whether details are loading
 */
interface QuantityAdjustItemDetailsProps {
  item: ItemOption | null;
  currentQty: number;
  currentPrice: number | null;
  loading: boolean;
}

/**
 * Details panel for selected inventory item.
 * 
 * Displays:
 * - Selected item name
 * - Current quantity (with loading state)
 * - Current price (with loading state)
 * 
 * Only renders when item is selected to keep UI clean and focused.
 * 
 * @component
 * @param props - Component props
 * @returns Details panel or null if no item selected
 * 
 * @example
 * ```tsx
 * <QuantityAdjustItemDetails
 *   item={selectedItem}
 *   currentQty={effectiveCurrentQty}
 *   currentPrice={effectiveCurrentPrice}
 *   loading={itemDetailsLoading}
 * />
 * ```
 */
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
    <Box sx={{ display: 'grid', gap: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
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
