/**
 * DeleteConfirmationView - Confirmation presentation component
 *
 * Renders: Warning + item details + confirmation prompt
 * Responsibility: Final review before irreversible deletion
 * Props: state object from useDeleteItemDialog hook
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
            {t('inventory:deleteFlow.warningTitle', 'This action cannot be undone!')}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {t(
              'inventory:deleteFlow.warningMessage',
              'Once deleted, the item and all associated records will be permanently removed from the system.'
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
        {t('inventory:deleteFlow.confirmationPrompt', 'Are you sure you want to proceed?')}
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
            {t('inventory:deleteFlow.itemBeingDeleted', 'Item being deleted:')}
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
