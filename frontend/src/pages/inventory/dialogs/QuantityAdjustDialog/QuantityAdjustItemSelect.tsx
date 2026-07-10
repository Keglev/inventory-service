/**
 * @file QuantityAdjustItemSelect.tsx
 * @module pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustItemSelect
 *
 * @summary
 * Step 2 of the quantity-adjust form: Autocomplete for selecting an
 * item, gated by a selected supplier.
 *
 * @enterprise
 * - Mirrors the pattern in DeleteFormFields.ItemSelectField but extracted
 *   to a standalone component instead of bundled in a multi-field file.
 *   The trade-off is more files; the benefit is independent unit tests
 *   for each step.
 * - Disabled when no supplier is selected, with a placeholder hint that
 *   tells the user why. The 2-character search minimum lives in the
 *   upstream useItemSearchQuery hook; this component only exposes the
 *   visible state.
 */

import * as React from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { ItemOption, SupplierOption } from '../../../../api/analytics/types';

interface QuantityAdjustItemSelectProps {
  selectedItem: ItemOption | null;
  onItemChange: (item: ItemOption | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  items: ItemOption[] | undefined;
  loading: boolean;
  selectedSupplier: SupplierOption | null;
}

export const QuantityAdjustItemSelect: React.FC<QuantityAdjustItemSelectProps> = ({
  selectedItem,
  onItemChange,
  searchQuery,
  onSearchChange,
  items,
  loading,
  selectedSupplier,
}) => {
  const { t } = useTranslation(['common', 'inventory']);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom color="primary">
        {t('inventory:steps.selectItem')}
      </Typography>

      <Autocomplete
        fullWidth
        size="small"
        options={items || []}
        getOptionLabel={(option) => option.name}
        value={selectedItem}
        onChange={(_, newValue) => onItemChange(newValue)}
        inputValue={searchQuery}
        onInputChange={(_, newInputValue) => onSearchChange(newInputValue)}
        disabled={!selectedSupplier}
        loading={loading}
        noOptionsText={
          searchQuery.length < 2
            ? t('inventory:search.typeToSearch')
            : t('inventory:search.noItemsFound')
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('inventory:search.searchSelectItem')}
            placeholder={
              !selectedSupplier ? t('inventory:search.selectSupplierFirst') : undefined
            }
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        sx={{ mb: 2 }}
      />
    </Box>
  );
};
