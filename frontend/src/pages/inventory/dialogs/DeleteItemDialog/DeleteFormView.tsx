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
 * - Deletion takes no reason: it is a pure catalog removal the
 *   backend only accepts at quantity zero. When the selected item still
 *   has stock, an inline warning explains the quantity-zero rule; the
 *   parent dialog additionally disables the Delete button.
 * - The numbered step badges scaffold the user through an irreversible
 *   operation, slowing the flow deliberately.
 * - StepSection (numbered step wrapper) lives in its own module (./StepSection).
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
      <StepSection
        title={t('inventory:deleteFlow.step1')}
        number={1}
      >
        <SupplierSelectField state={state} />
      </StepSection>

      {state.selectedSupplier && (
        <StepSection
          title={t('inventory:deleteFlow.step2')}
          number={2}
        >
          <ItemSelectField state={state} />
        </StepSection>
      )}

      {state.selectedItem && state.itemDetailsQuery.data && (
        <StepSection
          title={t('inventory:deleteFlow.step3')}
          number={3}
        >
          <ItemInfoDisplay state={state} />
        </StepSection>
      )}

      {blockedByStock && (
        <Alert severity="warning">
          {t('errors:inventory.businessRules.quantityMustBeZero')}
        </Alert>
      )}

      {state.formError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {state.formError}
        </Alert>
      )}
    </Box>
  );
}
