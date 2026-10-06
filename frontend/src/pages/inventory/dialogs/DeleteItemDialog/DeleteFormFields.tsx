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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { UseDeleteItemDialogReturn } from './DeleteItemDialog.types';
import { ItemSearchField } from '../../components/ItemSearchField';

/**
 * SupplierSelectField - Step 1: Select supplier from dropdown
 * 
 * @param state - Complete dialog state from useDeleteItemDialog hook
 * 
 * @behavior
 * - Shows loading spinner while fetching suppliers from API
 * - Displays dropdown with all available suppliers
 * - On selection: updates state.selectedSupplier (triggers item search reset)
 * - On change: clears previously selected item and search query
 * 
 * @visibility
 * - Always visible in form view
 * - First step that must be completed
 * - Enables Step 2 (item selection) when completed
 * 
 * @performance
 * - Suppliers loaded once via useSuppliersQuery (5-minute cache)
 */
export function SupplierSelectField({ state }: { state: UseDeleteItemDialogReturn }) {
  const { t } = useTranslation(['common', 'inventory']);
  
  // Show loading state while suppliers are being fetched from API
  if (state.suppliersQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          {t('common:loading')}
        </Typography>
      </Box>
    );
  }

  return (
    <FormControl fullWidth>
      <InputLabel id="supplier-select-label">
        {t('inventory:table.supplier')}
      </InputLabel>
      <Select
        labelId="supplier-select-label"
        value={state.selectedSupplier?.id ?? ''}
        onChange={(e) => {
          // Find supplier by ID and update state
          // Handles both string and numeric IDs via String comparison
          const supplier = state.suppliersQuery.data?.find(
            (s) => String(s.id) === String(e.target.value)
          );
          state.setSelectedSupplier(supplier ?? null);
        }}
        label={t('inventory:table.supplier')}
      >
        {/* Render all suppliers as menu items for selection */}
        {state.suppliersQuery.data?.map((supplier) => (
          <MenuItem key={supplier.id} value={supplier.id}>
            {supplier.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

/**
 * ItemSelectField - Step 2: Search and select item (shared ItemSearchField)
 * 
 * @param state - Complete dialog state from useDeleteItemDialog hook
 * 
 * @behavior
 * - Shows an info alert until a supplier is selected
 * - Matches the supplier's items by name or SKU from 2 characters on
 * - On selection: updates state.selectedItem; the field shows its name
 * - On input change: updates state.itemQuery (matched in the browser)
 * 
 * @visibility
 * - Visible only after Step 1 (supplier) is completed
 * - Conditional render: {state.selectedSupplier && (...)}
 * - Enables Step 3 (item information) when item is selected
 * 
 * @performance
 * - The supplier's items load once; typing sends no request (ADR-0014)
 */
export function ItemSelectField({ state }: { state: UseDeleteItemDialogReturn }) {
  const { t } = useTranslation(['common', 'inventory']);
  
  // Guard: cannot search items without selecting supplier first
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

/**
 * ItemInfoDisplay - Step 3: Show item details for final confirmation
 * 
 * @param state - Complete dialog state from useDeleteItemDialog hook
 * @returns Item preview card or null if no item selected/loaded
 * 
 * @behavior
 * - Only renders when item is selected AND details are loaded
 * - Shows: item name and on-hand quantity
 * - Non-interactive: displays information for user verification
 * - Helps user confirm they're deleting the correct item
 * 
 * @visibility
 * - Visible only after Step 2 (item) is completed
 * - Only renders if itemDetailsQuery has data (name and on-hand quantity)
 * - Conditional render: {state.selectedItem && state.itemDetailsQuery.data && (...)}
 * 
 * @styling
 * - Light background (action.hover) to visually separate from form
 * - Padding and border radius for readable presentation
 * - Typography hierarchy: label -> value for clarity
 */
export function ItemInfoDisplay({ state }: { state: UseDeleteItemDialogReturn }) {
  const { t } = useTranslation(['inventory']);

  // Guard: only render if item is selected and details are loaded
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
      {/* Item name section */}
      <Typography variant="body2" color="text.secondary">
        {t('inventory:table.name')}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {state.itemDetailsQuery.data.name}
      </Typography>

      {/* Item on-hand quantity section */}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {t('inventory:table.onHand')}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {state.itemDetailsQuery.data.onHand}
      </Typography>
    </Box>
  );
}
