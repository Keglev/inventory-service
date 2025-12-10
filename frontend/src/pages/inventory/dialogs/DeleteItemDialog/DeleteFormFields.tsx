/**
 * DeleteFormFields - Individual field components for delete workflow
 */

import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Autocomplete,
  TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { UseDeleteItemDialogReturn } from './DeleteItemDialog.types';

// Supplier selection dropdown - enables item search once selected
export function SupplierSelectField({ state }: { state: UseDeleteItemDialogReturn }) {
  const { t } = useTranslation(['common', 'inventory']);
  // Show loading while fetching supplier list
  if (state.suppliersQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">{t('common:loading', 'Loading...')}</Typography>
      </Box>
    );
  }

  return (
    <FormControl fullWidth>
      <InputLabel id="supplier-select-label">
        {t('inventory:table.supplier', 'Supplier')}
      </InputLabel>
      <Select
        labelId="supplier-select-label"
        value={state.selectedSupplier?.id ?? ''}
        onChange={(e) => {
          const supplier = state.suppliersQuery.data?.find(
            (s) => String(s.id) === String(e.target.value)
          );
          state.setSelectedSupplier(supplier ?? null);
        }}
        label={t('inventory:table.supplier', 'Supplier')}
      >
        {state.suppliersQuery.data?.map((supplier) => (
          <MenuItem key={supplier.id} value={supplier.id}>
            {supplier.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

// Item search autocomplete - requires supplier selection and 2+ char search
export function ItemSelectField({ state }: { state: UseDeleteItemDialogReturn }) {
  const { t } = useTranslation(['common', 'inventory']);
  // Disabled until supplier selected
  if (!state.selectedSupplier) {
    return <Alert severity="info">{t('inventory:search.selectSupplierFirst', 'Select a supplier to enable search.')}</Alert>;
  }
  // Show loading while fetching items for selected supplier
  if (state.itemsQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">{t('common:loading', 'Loading...')}</Typography>
      </Box>
    );
  }

  return (
    <Autocomplete
      key={state.selectedSupplier?.id}
      disabled={!state.selectedSupplier}
      options={state.itemsQuery.data ?? []}
      getOptionLabel={(option) => option.name}
      value={state.selectedItem}
      onChange={(_e, value) => {
        state.setSelectedItem(value);
        state.setItemQuery('');
      }}
      inputValue={state.itemQuery}
      onInputChange={(_e, value) => state.setItemQuery(value)}
      noOptionsText={
        state.itemQuery.length < 2
          ? t('inventory:search.typeToSearch', 'Type at least 2 characters to search')
          : t('inventory:search.noItemsFound', 'No items found for this search.')
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('inventory:item', 'Item')}
          placeholder={t('inventory:search.typeToSearchItems', 'Type to search items...')}
        />
      )}
    />
  );
}

// Deletion reason selector - shows predefined business-valid reasons
export function DeletionReasonField({ state }: { state: UseDeleteItemDialogReturn }) {
  const { t } = useTranslation(['inventory']);

  return (
    <FormControl fullWidth>
      <InputLabel>
        {t('inventory:deleteFlow.deletionReasonLabel', 'Deletion Reason')}
      </InputLabel>
      <Select
        label={t('inventory:deleteFlow.deletionReasonLabel', 'Deletion Reason')}
        value={state.deletionReason}
        onChange={(e) => state.setDeletionReason(e.target.value)}
      >
        <MenuItem value="SCRAPPED">
          {t('inventory:reasons.reasonScrapped', 'Scrapped - Quality control removal')}
        </MenuItem>
        <MenuItem value="DESTROYED">
          {t('inventory:reasons.reasonDestroyed', 'Destroyed - Catastrophic loss')}
        </MenuItem>
        <MenuItem value="DAMAGED">
          {t('inventory:reasons.reasonDamaged', 'Damaged - Quality hold')}
        </MenuItem>
        <MenuItem value="EXPIRED">
          {t('inventory:reasons.reasonExpired', 'Expired - Expiration date breach')}
        </MenuItem>
        <MenuItem value="LOST">
          {t('inventory:reasons.reasonLost', 'Lost - Inventory shrinkage')}
        </MenuItem>
        <MenuItem value="RETURNED_TO_SUPPLIER">
          {t('inventory:reasons.reasonReturnedToSupplier', 'Returned to Supplier - Defective merchandise')}
        </MenuItem>
      </Select>
    </FormControl>
  );
}

// Item preview - shows name and on-hand quantity for final review
export function ItemInfoDisplay({ state }: { state: UseDeleteItemDialogReturn }) {
  const { t } = useTranslation(['inventory']);

  if (!state.selectedItem || !state.itemDetailsQuery.data) {
    return null;
  }

  return (
    <Box
      sx={{
        p: 1.5,
        bgcolor: 'action.hover',
        borderRadius: 1,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {t('inventory:table.name', 'Name')}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {state.itemDetailsQuery.data.name}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {t('inventory:table.onHand', 'On-hand')}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {state.itemDetailsQuery.data.onHand}
      </Typography>
    </Box>
  );
}
