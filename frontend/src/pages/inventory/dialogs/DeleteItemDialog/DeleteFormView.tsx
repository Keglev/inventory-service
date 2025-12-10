/**
 * DeleteFormView - Form presentation component
 *
 * Renders: 4-step form (supplier → item → reason → preview)
 * Responsibility: Layout and field composition with inline commenting
 * Props: state object from useDeleteItemDialog hook
 */

import { Box, Alert, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  SupplierSelectField,
  ItemSelectField,
  DeletionReasonField,
  ItemInfoDisplay,
} from './DeleteFormFields';

/**
 * StepSection - Reusable step indicator and content wrapper
 * Renders: Numbered badge with title + indented content
 */
function StepSection({
  title,
  number,
  children,
}: {
  title: string;
  number: number;
  children: React.ReactNode;
}) {
  return (
    <Box>
      {/* Step header: numbered badge + title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          {number}
        </Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      {/* Step content: indented to show hierarchy */}
      <Box sx={{ pl: 4 }}>{children}</Box>
    </Box>
  );
}
import type { UseDeleteItemDialogReturn } from './DeleteItemDialog.types';

export function DeleteFormView({ state }: { state: UseDeleteItemDialogReturn }) {
  const { t } = useTranslation(['inventory']);

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
        STEP 3: Deletion Reason
        - Only visible after item selected
        - Predefined business reasons: SCRAPPED, DESTROYED, DAMAGED, etc.
        - Required for audit trail and inventory accounting
      */}
      {state.selectedItem && (
        <StepSection
          title={t('inventory:deleteFlow.step3', 'Step 3: Deletion Reason')}
          number={3}
        >
          <DeletionReasonField state={state} />
        </StepSection>
      )}

      {/* 
        STEP 4: Item Information Preview
        - Only visible after item details are loaded from API
        - Shows name and on-hand quantity for final confirmation
        - Helps user verify they're deleting the correct item
      */}
      {state.selectedItem && state.itemDetailsQuery.data && (
        <StepSection
          title={t('inventory:deleteFlow.step4', 'Step 4: Item Information')}
          number={4}
        >
          <ItemInfoDisplay state={state} />
        </StepSection>
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
