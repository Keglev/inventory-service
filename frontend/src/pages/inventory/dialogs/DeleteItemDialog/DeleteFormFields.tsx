/**
 * DeleteFormFields - Isolated field components for delete workflow
 * 
 * @module dialogs/DeleteItemDialog/DeleteFormFields
 * @description
 * Individual form field components for the 4-step delete item workflow.
 * Each field is isolated for easier testing, reuse, and composition.
 * 
 * @enterprise
 * - Single Responsibility: each component manages one field
 * - Testable: can be tested independently with mock state
 * - Reusable: can be composed into custom forms
 * - Type-safe: all props are strictly typed
 * - i18n-ready: all labels and messages are translated
 * 
 * @components
 * - SupplierSelectField: Step 1 - Choose supplier from dropdown
 * - ItemSelectField: Step 2 - Search and autocomplete select item
 * - DeletionReasonField: Step 3 - Choose predefined deletion reason
 * - ItemInfoDisplay: Step 4 - Show item details for confirmation
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
          {t('common:loading', 'Loading...')}
        </Typography>
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
          // Find supplier by ID and update state
          // Handles both string and numeric IDs via String comparison
          const supplier = state.suppliersQuery.data?.find(
            (s) => String(s.id) === String(e.target.value)
          );
          state.setSelectedSupplier(supplier ?? null);
        }}
        label={t('inventory:table.supplier', 'Supplier')}
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
 * ItemSelectField - Step 2: Search and select item via autocomplete
 * 
 * @param state - Complete dialog state from useDeleteItemDialog hook
 * 
 * @behavior
 * - Disabled until supplier is selected (shows info alert)
 * - Shows loading spinner while searching items
 * - Autocomplete with debounced search (2+ characters required)
 * - On selection: updates state.selectedItem, clears search query
 * - On input change: updates state.itemQuery (triggers search via API)
 * 
 * @visibility
 * - Visible only after Step 1 (supplier) is completed
 * - Conditional render: {state.selectedSupplier && (...)}
 * - Enables Step 3 (reason) when item is selected
 * 
 * @search-behavior
 * - Requires minimum 2 characters before API call
 * - Shows helpful message if < 2 characters typed
 * - Shows "no items found" message if search returns empty
 * - Filters items by selected supplier via backend query
 * 
 * @performance
 * - Debounced search (350ms) via useDebounced hook
 * - Minimal API calls: only when 2+ chars and supplier selected
 * - Uses Autocomplete internal value management for efficiency
 */
export function ItemSelectField({ state }: { state: UseDeleteItemDialogReturn }) {
  const { t } = useTranslation(['common', 'inventory']);
  
  // Guard: cannot search items without selecting supplier first
  if (!state.selectedSupplier) {
    return (
      <Alert severity="info">
        {t('inventory:search.selectSupplierFirst', 'Select a supplier to enable search.')}
      </Alert>
    );
  }
  
  // Show loading state while API searches items matching query
  if (state.itemsQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          {t('common:loading', 'Loading...')}
        </Typography>
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
        // Clear search query after selection for clean slate
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

/**
 * DeletionReasonField - Step 3: Select predefined deletion reason
 * 
 * @param state - Complete dialog state from useDeleteItemDialog hook
 * 
 * @behavior
 * - Dropdown menu with 6 predefined business reasons
 * - On change: updates state.deletionReason
 * - Required for audit trail and inventory accounting
 * 
 * @visibility
 * - Visible only after Step 2 (item) is completed
 * - Conditional render: {state.selectedItem && (...)}
 * - Enables Step 4 (preview) when reason selected
 * 
 * @reasons
 * - SCRAPPED: Quality control removal of defective items
 * - DESTROYED: Catastrophic loss (fire, damage, etc)
 * - DAMAGED: Quality hold pending resolution
 * - EXPIRED: Expiration date exceeded
 * - LOST: Inventory shrinkage/theft
 * - RETURNED_TO_SUPPLIER: Defective merchandise returned
 * 
 * @business-logic
 * - Reason is stored with deletion for audit and accounting purposes
 * - Each reason may trigger different GL posting in finance system
 * - Required field: form cannot proceed without selection
 */
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
        {/* Predefined deletion reasons with business descriptions */}
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

/**
 * ItemInfoDisplay - Step 4: Show item details for final confirmation
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
 * - Only renders if itemDetailsQuery has data
 * - Conditional render: {state.selectedItem && state.itemDetailsQuery.data && (...)}
 * 
 * @styling
 * - Light background (action.hover) to visually separate from form
 * - Padding and border radius for readable presentation
 * - Typography hierarchy: label → value for clarity
 * 
 * @ux-purpose
 * - Final verification before showing confirmation dialog
 * - Reduces risk of user accidentally deleting wrong item
 * - User sees on-hand quantity to verify it's safe to delete
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
        {t('inventory:table.name', 'Name')}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {state.itemDetailsQuery.data.name}
      </Typography>

      {/* Item on-hand quantity section */}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {t('inventory:table.onHand', 'On-hand')}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {state.itemDetailsQuery.data.onHand}
      </Typography>
    </Box>
  );
}
