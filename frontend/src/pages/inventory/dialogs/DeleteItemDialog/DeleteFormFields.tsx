/**
 * @file DeleteFormFields.tsx
 * @module pages/inventory/dialogs/DeleteItemDialog/DeleteFormFields
 *
 * @summary
 * Three field components for the three steps of the delete flow:
 * SupplierSelectField, ItemSelectField, and ItemInfoDisplay.
 *
 * @enterprise
 * - Each field consumes the shared UseDeleteItemDialogReturn state object
 *   instead of threading individual props. Trade-off: state coupling at
 *   compile time, easier mounting at test time.
 * - ItemSelectField is the shared ItemSearchField: it stays mounted while
 *   items load, so typing keeps focus.
 * - Deletion takes no reason: it is a pure catalog removal, only accepted
 *   by the backend once the quantity is already zero, so the stock
 *   movement that emptied the item was audited by the preceding quantity
 *   adjustment.
 * - The 2-character minimum, the name-or-SKU match and the supplier
 *   scoping live upstream in useItemSearchQuery; this file only shows them.
 */

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { UseDeleteItemDialogReturn } from './DeleteItemDialog.types';
import { ItemSearchField } from '../../components/ItemSearchField';
import { SupplierPickerField } from '../../../../components/search/SupplierPickerField';

/** Step 1: pick the supplier (shared SupplierPickerField); a change clears the item and its search. */
export function SupplierSelectField({ state }: { state: UseDeleteItemDialogReturn }) {
  const { t } = useTranslation(['common', 'inventory']);
  
  if (state.suppliersQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('common:loading')}
        </Typography>
      </Box>
    );
  }

  return (
    <SupplierPickerField
      suppliers={state.suppliersQuery.data ?? []}
      loading={state.suppliersQuery.isLoading}
      value={state.selectedSupplier}
      onSelect={state.setSelectedSupplier}
      label={t('inventory:table.supplier')}
    />
  );
}

/** Step 2: pick the item from the supplier's list, matched in the browser by name or SKU (frontend ADR-0014). */
export function ItemSelectField({ state }: { state: UseDeleteItemDialogReturn }) {
  const { t } = useTranslation(['common', 'inventory']);
  
  if (!state.selectedSupplier) {
    return (
      <Alert severity="info">
        {t('inventory:search.selectSupplierFirst')}
      </Alert>
    );
  }
  
  return (
    <ItemSearchField
      query={state.itemQuery}
      onQueryChange={state.setItemQuery}
      results={state.itemsQuery.data}
      loading={state.itemsQuery.isLoading}
      value={state.selectedItem}
      onSelect={state.setSelectedItem}
    />
  );
}

/** Step 3: the selected item's name and on-hand quantity for a last check; null until its details load. */
export function ItemInfoDisplay({ state }: { state: UseDeleteItemDialogReturn }) {
  const { t } = useTranslation(['inventory']);

  if (!state.selectedItem || !state.itemDetailsQuery.data) {
    return null;
  }

  return (
    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {t('inventory:table.name')}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {state.itemDetailsQuery.data.name}
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
        {t('inventory:table.onHand')}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {state.itemDetailsQuery.data.onHand}
      </Typography>
    </Box>
  );
}
