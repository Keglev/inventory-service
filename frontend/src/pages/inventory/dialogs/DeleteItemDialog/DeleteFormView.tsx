/**
 * @file DeleteFormView.tsx
 * @module pages/inventory/dialogs/DeleteItemDialog/DeleteFormView
 *
 * @summary
 * Three-step form layout for the delete flow: supplier, item, and
 * item-info preview, each presented with a numbered step indicator.
 *
 * @enterprise
 * - Progressive disclosure: each step renders only after the previous step
 *   produces the value it depends on. Supplier selection unlocks item
 *   search; item selection unlocks the info preview.
 * - Deletion takes no reason (CB-APP71): it is a pure catalog removal the
 *   backend only accepts at quantity zero. When the selected item still
 *   has stock, an inline warning explains the quantity-zero rule; the
 *   parent dialog additionally disables the Delete button.
 * - The numbered step badges scaffold the user through an irreversible
 *   operation, slowing the flow deliberately.
 * - StepSection (numbered step wrapper) is extracted to its own module
 *   (./StepSection) and imported here, keeping the import block intact.
 */

import { Box, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  SupplierSelectField,
  ItemSelectField,
  ItemInfoDisplay,
} from './DeleteFormFields';
import type { UseDeleteItemDialogReturn } from './DeleteItemDialog.types';
import { StepSection } from './StepSection';

export function DeleteFormView({ state }: { state: UseDeleteItemDialogReturn }) {
  const { t } = useTranslation(['inventory', 'errors']);

  // Pre-gate hint: the backend only accepts deletion at quantity zero.
  const onHand = state.itemDetailsQuery.data?.onHand ?? 0;
  const blockedByStock = Boolean(state.selectedItem) && onHand > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/*
        STEP 1: Supplier Selection
        - Always visible - user must choose supplier first
        - Enables subsequent item search by filtering supplier context
        - Required before item selection is possible
      */}
      <StepSection
        title={t('inventory:deleteFlow.step1', 'Step 1: Select Supplier')}
        number={1}
      >
        <SupplierSelectField state={state} />
      </StepSection>

      {/*
        STEP 2: Item Search
        - Only visible after supplier selected
        - Autocomplete with 2+ character minimum search requirement
        - Filters items to selected supplier using search API
      */}
      {state.selectedSupplier && (
        <StepSection
          title={t('inventory:deleteFlow.step2', 'Step 2: Select Item')}
          number={2}
        >
          <ItemSelectField state={state} />
        </StepSection>
      )}

      {/*
        STEP 3: Item Information Preview
        - Only visible after item details are loaded from API
        - Shows name and on-hand quantity for final confirmation
        - Helps user verify they're deleting the correct item
      */}
      {state.selectedItem && state.itemDetailsQuery.data && (
        <StepSection
          title={t('inventory:deleteFlow.step3', 'Step 3: Item Information')}
          number={3}
        >
          <ItemInfoDisplay state={state} />
        </StepSection>
      )}

      {/*
        Quantity-zero pre-gate hint
        - Shown when the selected item still has stock on hand
        - Mirrors the backend rule (409 'conflict' at quantity > 0)
        - The Delete button in the parent dialog is disabled in this state
      */}
      {blockedByStock && (
        <Alert severity="warning">
          {t('errors:inventory.businessRules.quantityMustBeZero')}
        </Alert>
      )}

      {/*
        Form-level error display
        - Shows validation errors from form submission attempt
        - Prevents proceeding to confirmation without valid selections
      */}
      {state.formError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {state.formError}
        </Alert>
      )}
    </Box>
  );
}
