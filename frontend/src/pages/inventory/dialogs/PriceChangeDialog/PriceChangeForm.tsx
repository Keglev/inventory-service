/**
 * @file PriceChangeForm.tsx
 * @module pages/inventory/dialogs/PriceChangeDialog/PriceChangeForm
 *
 * @summary
 * Three-step form for changing prices: supplier select, item
 * autocomplete, new-price input with current-price reference panel.
 *
 * @enterprise
 * - Progressive disclosure: supplier required before item search;
 *   item required before price input is enabled. Same scaffolding
 *   pattern as EditItemForm and the QuantityAdjustForm.
 * - The current/effective price comes from the orchestrator hook's
 *   itemDetailsQuery, with a fallback to the search-result price. The
 *   selected-item panel renders the live values; the helper text under
 *   the new-price field shows the from/to delta.
 * - newPrice input is gated by selectedItem -- typing in the box without
 *   a selected item is impossible. The button disabled state on the
 *   parent dialog is the redundant final gate.
 *
 * Size note: 166 code lines, six over the dialog alarm threshold (160);
 * the helper text's number formatting added two.
 * WAIVED: a single pure render function with all state injected; the item
 * details panel is already extracted (SelectedItemDetails), and any
 * further cut would slice contiguous form markup to hit a number, which
 * the house standard forbids. Re-measure if a fourth field group is added.
 */

import {
  Box,
  TextField,
  Typography,
  Alert,
  Divider,
} from '@mui/material';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { fieldErrorText } from '../../../../utils/fieldErrorText';
import { useSettings } from '../../../../hooks/useSettings';
import { formatNumber } from '../../../../utils/formatters';
import { SelectedItemDetails } from '../SelectedItemDetails';
import { ItemSearchField } from '../../components/ItemSearchField';
import { SupplierPickerField } from '../../../../components/search/SupplierPickerField';
import type { UsePriceChangeFormReturn } from './usePriceChangeForm';

export function PriceChangeForm({ state }: { state: UsePriceChangeFormReturn }) {
  const { t } = useTranslation(['common', 'inventory', 'errors']);
  const { userPreferences } = useSettings();
  const euro = (n: number) => `${formatNumber(n, userPreferences.numberFormat, 2)} €`;

  return (
    <Box sx={{ display: 'grid', gap: 2.5, mt: 1 }}>
      {/* Error banner for non-field errors */}
      {state.formError && (
        <Alert severity="error" onClose={() => state.setFormError('')}>
          {state.formError}
        </Alert>
      )}

      {/* Step 1: Supplier Selection */}
      <Box>
        <Typography variant="subtitle2" gutterBottom color="primary">
          {t('inventory:steps.selectSupplier')}
        </Typography>
        <SupplierPickerField
          suppliers={state.suppliers}
          loading={state.suppliersLoading}
          value={state.selectedSupplier}
          onSelect={state.setSelectedSupplier}
          label={t('inventory:table.supplier')}
        />
      </Box>

      {/* Step 2: Item Selection */}
      <Box>
        <Typography variant="subtitle2" gutterBottom color="primary">
          {t('inventory:steps.selectItem')}
        </Typography>
        <ItemSearchField
          query={state.itemQuery}
          onQueryChange={state.setItemQuery}
          results={state.items}
          loading={state.itemsLoading}
          value={state.selectedItem}
          onSelect={state.setSelectedItem}
          disabled={!state.selectedSupplier}
        />
      </Box>

      {/* Selected Item Details */}
      <SelectedItemDetails
        item={state.selectedItem}
        currentPrice={state.effectiveCurrentPrice}
        currentQty={state.effectiveCurrentQty}
        loading={state.itemDetailsLoading}
        showTotal
      />

      <Divider />

      {/* Step 3: Price Change */}
      <Box>
        <Typography variant="subtitle2" gutterBottom color="primary">
          {t('inventory:steps.changePrice')}
        </Typography>
        <Controller
          name="newPrice"
          control={state.control}
          render={({ field: { onChange, value, ...field } }) => (
            <TextField
              {...field}
              value={value}
              // Number('') is 0: an emptied field reads as zero.
              onChange={(e) => onChange(Number(e.target.value))}
              label={t('inventory:price.newPrice')}
              type="number"
              fullWidth
              disabled={!state.selectedItem}
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: 0.01,
                },
              }}
              error={!!state.formState.errors.newPrice}
              helperText={
                fieldErrorText(state.formState.errors.newPrice, t) ||
                (state.selectedItem
                    ? t('inventory:price.priceChange', {
                        from: euro(state.effectiveCurrentPrice),
                        to: euro(Number(value)),
                      }) +
                      ' · ' +
                      t('inventory:price.newTotalValue', {
                        total: euro(Number(value) * state.effectiveCurrentQty),
                      })
                    : '')
              }
            />
          )}
        />
      </Box>
    </Box>
  );
}
