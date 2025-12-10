/**
 * @file DeleteItemContent.tsx
 * @description
 * Content renderer for DeleteItemDialog.
 * Switches between form view and confirmation view.
 * Delegates field rendering to DeleteFormFields components.
 */

import { Box, Alert, Divider, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  SupplierSelectField,
  ItemSelectField,
  DeletionReasonField,
  ItemInfoDisplay,
} from './DeleteFormFields';
import type { UseDeleteItemDialogReturn, DeleteItemContentProps } from './DeleteItemDialog.types';

/**
 * Main content component - decides which view to render
 *
 * @component
 */
export function DeleteItemContent({
  state,
  showConfirmation,
}: DeleteItemContentProps) {
  return showConfirmation ? (
    <ConfirmationView state={state} />
  ) : (
    <FormView state={state} />
  );
}

/**
 * Form view: 4-step workflow for item deletion
 *
 * Step 1: Select supplier
 * Step 2: Search and select item
 * Step 3: Choose deletion reason
 * Step 4: Review item information
 */
function FormView({ state }: { state: UseDeleteItemDialogReturn }) {
  const { t } = useTranslation(['common', 'inventory', 'errors']);

  return (
    <Box sx={{ display: 'grid', gap: 2.5, mt: 1 }}>
      {/* Error message banner */}
      {state.formError && (
        <Alert severity="error" onClose={() => state.setFormError('')}>
          {state.formError}
        </Alert>
      )}

      {/* ========================================
          Step 1: Supplier Selection
          ======================================== */}
      <StepSection
        stepNumber={1}
        title={t('inventory:steps.selectSupplier')}
      >
        <SupplierSelectField state={state} />
      </StepSection>

      <Divider />

      {/* ========================================
          Step 2: Item Selection
          ======================================== */}
      <StepSection
        stepNumber={2}
        title={t('inventory:steps.selectItem')}
      >
        <ItemSelectField state={state} />
      </StepSection>

      {/* ========================================
          Step 3: Deletion Reason (conditional)
          ======================================== */}
      {state.selectedItem && (
        <>
          <Divider />
          <StepSection
            stepNumber={3}
            title={t('inventory:steps.selectReason', 'Step 3: Select Deletion Reason')}
          >
            <DeletionReasonField state={state} />
          </StepSection>
        </>
      )}

      {/* ========================================
          Step 4: Item Information (conditional)
          ======================================== */}
      {state.selectedItem && (
        <>
          <Divider />
          <StepSection
            stepNumber={4}
            title={t('inventory:dialogs.itemInfoTitle', 'Item Information')}
          >
            <ItemInfoDisplay state={state} />
          </StepSection>
        </>
      )}
    </Box>
  );
}

/**
 * Confirmation view: Warning and item details
 * 
 * Shows:
 * - Warning that action cannot be reversed
 * - Confirmation prompt
 * - Item being deleted
 */
function ConfirmationView({ state }: { state: UseDeleteItemDialogReturn }) {
  const { t } = useTranslation(['common', 'inventory', 'errors']);

  return (
    <Box>
      <Alert severity="warning" sx={{ mb: 2 }}>
        {t('inventory:deleteFlow.warning', 'This action cannot be reversed!!')}
      </Alert>

      <Typography variant="body1" gutterBottom>
        {t('inventory:deleteFlow.confirmMessage', 'Are you sure you want to delete this item?')}
      </Typography>

      {state.selectedItem && state.itemDetailsQuery.data && (
        <Box
          sx={{
            p: 1.5,
            bgcolor: 'action.hover',
            borderRadius: 1,
            mt: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {t('inventory:table.name', 'Item')}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {state.itemDetailsQuery.data.name}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

/**
 * Reusable step section component
 * Provides consistent styling for each form step
 */
function StepSection({
  stepNumber,
  title,
  children,
}: {
  stepNumber?: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, mb: 1 }}
      >
        {stepNumber ? `Step ${stepNumber}: ${title}` : title}
      </Typography>
      {children}
    </Box>
  );
}
