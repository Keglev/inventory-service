/**
 * @file DeleteConfirmationView.tsx
 * @module pages/inventory/dialogs/DeleteItemDialog/DeleteConfirmationView
 *
 * @summary
 * Confirmation step of the delete flow. Renders the irreversible-action
 * warning, the confirmation prompt, the item-details review, and any
 * post-submit error.
 *
 * @enterprise
 * - Warning comes BEFORE the confirmation prompt by design. The user reads
 *   the consequences before being asked to confirm, not after.
 * - Item details are re-rendered here, not just at the form step, so the
 *   user verifies the target at the irreversible moment.
 * - formError is rendered last so a failed deletion attempt surfaces under
 *   the same review block, keeping context for retry.
 */

import { Box, Alert, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ItemInfoDisplay } from './DeleteFormFields';
import type { UseDeleteItemDialogReturn } from './DeleteItemDialog.types';

export function DeleteConfirmationView({
  state,
}: {
  state: UseDeleteItemDialogReturn;
}) {
  const { t } = useTranslation(['inventory', 'errors']);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 
        IRREVERSIBLE ACTION WARNING
        - Red alert emphasizing this cannot be undone
        - Motivates user to carefully review item details below
        - Sets appropriate tone for destructive operation
      */}
      <Alert severity="warning" icon={false}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {t('inventory:deleteFlow.warningTitle')}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {t(
              'inventory:deleteFlow.warningMessage'
            )}
          </Typography>
        </Box>
      </Alert>

      {/* 
        CONFIRMATION PROMPT
        - Direct question asking for final user confirmation
        - Placed after warning to ensure user reads it
      */}
      <Typography>
        {t('inventory:deleteFlow.confirmationPrompt')}
      </Typography>

      {/* 
        ITEM DETAILS REVIEW
        - Shows item name and on-hand quantity one final time
        - Allows user to verify they're deleting the correct item
        - Placement after warning ensures careful review
      */}
      {state.selectedItem && state.itemDetailsQuery.data && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t('inventory:deleteFlow.itemBeingDeleted')}
          </Typography>
          <ItemInfoDisplay state={state} />
        </Box>
      )}

      {/* 
        Confirmation-level error display
        - Shows API errors or validation failures during deletion
        - Allows user to cancel and try again
      */}
      {state.formError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {state.formError}
        </Alert>
      )}
    </Box>
  );
}
