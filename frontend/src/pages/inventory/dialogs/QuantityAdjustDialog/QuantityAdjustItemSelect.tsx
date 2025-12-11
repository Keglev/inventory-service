/**
 * @file QuantityAdjustItemSelect.tsx
 * @module dialogs/QuantityAdjustDialog/QuantityAdjustItemSelect
 *
 * @summary
 * Specialized component for item selection step.
 * Pure presentation component with autocomplete search.
 *
 * @enterprise
 * - Single responsibility: render item autocomplete only
 * - Handles search input and item selection
 * - Conditional rendering: disabled until supplier is selected
 * - Provides helpful placeholder and search hints
 */

import * as React from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { ItemOption, SupplierOption } from '../../../../api/analytics/types';

/**
 * Props for QuantityAdjustItemSelect component.
 * 
 * @interface QuantityAdjustItemSelectProps
 * @property {ItemOption | null} selectedItem - Currently selected item
 * @property {(item: ItemOption | null) => void} onItemChange - Item selection handler
 * @property {string} searchQuery - Current search query text
 * @property {(query: string) => void} onSearchChange - Search query change handler
 * @property {ItemOption[] | undefined} items - Available items filtered by supplier
 * @property {boolean} loading - Whether items are loading
 * @property {SupplierOption | null} selectedSupplier - Selected supplier (for disable logic)
 */
interface QuantityAdjustItemSelectProps {
  selectedItem: ItemOption | null;
  onItemChange: (item: ItemOption | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  items: ItemOption[] | undefined;
  loading: boolean;
  selectedSupplier: SupplierOption | null;
}

/**
 * Step 2: Item selection component.
 * 
 * Renders an autocomplete field for searching and selecting items.
 * Only enabled after a supplier is selected.
 * Provides search hints and loading indicators.
 * 
 * @component
 * @param props - Component props
 * @returns JSX element for item autocomplete
 * 
 * @example
 * ```tsx
 * <QuantityAdjustItemSelect
 *   selectedItem={form.selectedItem}
 *   onItemChange={form.setSelectedItem}
 *   searchQuery={form.itemQuery}
 *   onSearchChange={form.setItemQuery}
 *   items={form.items}
 *   loading={form.itemsLoading}
 *   selectedSupplier={form.selectedSupplier}
 * />
 * ```
 */
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
        {t('inventory:steps.selectItem', 'Step 2: Select Item')}
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
            ? t('inventory:search.typeToSearch', 'Type at least 2 characters to search')
            : t('inventory:search.noItemsFound', 'No items found')
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('inventory:search.searchSelectItem', 'Search and select item...')}
            placeholder={
              !selectedSupplier ? t('inventory:search.selectSupplierFirst', 'Select supplier first') : undefined
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
