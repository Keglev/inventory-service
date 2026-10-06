/**
 * @file SelectedItemDetails.tsx
 * @module pages/inventory/dialogs/SelectedItemDetails
 *
 * @summary
 * Reference panel above the input of the price-change and quantity-adjust
 * dialogs: the selected item's name, current quantity and current price,
 * and optionally the current total value, with spinners while loading.
 *
 * @enterprise
 * - One panel for both dialogs, so both show the same rows in the same
 *   order and format. The total is shown only where it is what the user
 *   changes: a price change moves the total; a quantity adjustment shows
 *   quantity and price only (owner's choice from the mockup).
 * - Renders nothing when no item is selected: the dialog input is disabled
 *   in that state, so the panel would carry no useful information.
 * - Prices use formatNumber with the user's number format and a Euro
 *   suffix, as in the grid columns and the item form.
 * - Pure presentation. The numbers come from the dialogs' effective-*
 *   derivations; a missing current price falls back to the search result's
 *   price.
 */

import { Box, Typography, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';
import type { ItemOption } from '../../../api/analytics/types';

interface SelectedItemDetailsProps {
  item: ItemOption | null;
  currentQty: number;
  currentPrice: number | null;
  loading: boolean;
  /** Adds the current total value (price x quantity) as a third row. */
  showTotal?: boolean;
}

export function SelectedItemDetails({
  item,
  currentQty,
  currentPrice,
  loading,
  showTotal = false,
}: SelectedItemDetailsProps) {
  const { t } = useTranslation(['inventory']);
  const { userPreferences } = useSettings();

  if (!item) return null;

  const price = currentPrice ?? item.price ?? 0;
  const euro = (n: number) => `${formatNumber(n, userPreferences.numberFormat, 2)} €`;

  const row = (label: string, value: string | number) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight="medium">
        {loading ? <CircularProgress size={16} /> : value}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'grid', gap: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
      <Typography variant="subtitle2" color="primary">
        {t('inventory:dialogs.selectedItemLabel')} {item.name}
      </Typography>
      {row(t('inventory:dialogs.currentQuantityLabel'), currentQty)}
      {row(t('inventory:dialogs.currentPriceLabel'), euro(price))}
      {showTotal && row(`${t('inventory:price.currentTotalValue')}:`, euro(price * currentQty))}
    </Box>
  );
}
