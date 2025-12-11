/**
 * @file QuantityAdjustDialog.tsx
 * @module dialogs/QuantityAdjustDialog/QuantityAdjustDialog
 *
 * @summary
 * Container component for quantity adjustment dialog.
 * Manages dialog lifecycle and delegates all state/form logic to orchestrator hook.
 *
 * @enterprise
 * - Thin container component focused on UI structure only
 * - Delegates all business logic to useQuantityAdjustForm orchestrator hook
 * - Manages dialog lifecycle: open/close with proper cleanup
 * - Provides help button with topic ID for contextual assistance
 * - Accessible form with proper semantic HTML and ARIA attributes
 */

import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  CircularProgress,
} from '@mui/material';
import { HelpIconButton } from '../../../../features/help';
import { useTranslation } from 'react-i18next';
import { QuantityAdjustForm } from './QuantityAdjustForm';
import { useQuantityAdjustForm } from './useQuantityAdjustForm';
import type { QuantityAdjustDialogProps } from './QuantityAdjustDialog.types';

/**
 * Enterprise-level quantity adjustment dialog component.
 * 
 * Provides a guided workflow for adjusting inventory quantities with proper
 * validation, audit trails, and user experience optimizations.
 * 
 * Workflow:
 * 1. User selects supplier from dropdown
 * 2. System loads available items for that supplier
 * 3. User selects specific item to adjust
 * 4. System fetches full item details
 * 5. User enters new quantity (≥ 0) and selects business reason
 * 6. System validates and applies quantity change with audit trail
 * 
 * Validation:
 * - Supplier must be selected before item selection is enabled
 * - Item must be selected before quantity adjustment is enabled
 * - New quantity must be non-negative (≥ 0)
 * - Business reason must be selected from predefined options
 * 
 * @component
 * @param props - Component props
 * @example
 * ```tsx
 * <QuantityAdjustDialog
 *   open={isDialogOpen}
 *   onClose={() => setIsDialogOpen(false)}
 *   onAdjusted={() => {
 *     refreshInventoryList();
 *     showSuccessMessage();
 *   }}
 * />
 * ```
 * 
 * @enterprise
 * - Implements step-by-step validation to prevent user errors
 * - Provides clear feedback on current item state (current quantity)
 * - Maintains audit trail through mandatory reason selection
 * - Prevents negative quantities that would cause system inconsistencies
 * - Supports internationalization for global deployment
 * - Uses shared data hooks for consistent behavior across dialogs
 */
export const QuantityAdjustDialog: React.FC<QuantityAdjustDialogProps> = ({
  open,
  onClose,
  onAdjusted,
  readOnly = false,
}) => {
  const { t } = useTranslation(['common', 'inventory']);

  // ================================
  // Form Management via Orchestrator Hook
  // ================================
  const form = useQuantityAdjustForm(open, onClose, onAdjusted, readOnly);

  // ================================
  // Render
  // ================================

  return (
    <Dialog open={open} onClose={form.handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>{t('inventory:toolbar.adjustQty', 'Adjust Quantity')}</Box>
          <HelpIconButton
            topicId="inventory.adjustQuantity"
            tooltip={t('actions.help', 'Help')}
          />
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <QuantityAdjustForm form={form} />
      </DialogContent>

      <DialogActions>
        <Button onClick={form.handleClose} disabled={form.formState.isSubmitting}>
          {t('common:actions.cancel', 'Cancel')}
        </Button>
        <Button
          onClick={form.onSubmit}
          disabled={form.formState.isSubmitting || !form.selectedItem}
          variant="contained"
        >
          {form.formState.isSubmitting ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              {t('common:saving', 'Saving...')}
            </>
          ) : (
            t('inventory:buttons.applyAdjustment', 'Apply Adjustment')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
