/**
 * @file QuantityAdjustDialog.tsx
 * @module pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustDialog
 *
 * @summary
 * Root dialog for the quantity-adjust flow. Title, form body, and
 * cancel/apply actions. All state and submission live in
 * useQuantityAdjustForm.
 *
 * @enterprise
 * - Single-dialog architecture. A quantity adjustment is reversible
 *   by another adjustment, so no second confirmation step is offered.
 *   Same pattern as EditItemDialog and PriceChangeDialog.
 * - This was the reference dialog for the canonical help-icon wiring:
 *   it uses the shared HelpIconButton component, not raw IconButton
 *   + HelpOutlineIcon. ItemFormDialog, PriceChangeDialog,
 *   DeleteItemDialog, and EditItemDialog have all converged on this
 *   pattern (CB-APP54, CB-APP57, CM-APP11 closures).
 * - Backend invariant: the reason must belong to the StockChangeReason
 *   enum that quantity adjustments actually support; backend
 *   StockHistoryValidator is the authority. The dialog offers only the
 *   reasons valid for the current change direction (see
 *   QuantityAdjustQuantityInput and quantityAdjustSchema).
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
import { HelpIconButton } from '../../../../features/help/components/HelpIconButton';
import { useTranslation } from 'react-i18next';
import { QuantityAdjustForm } from './QuantityAdjustForm';
import { useQuantityAdjustForm } from './useQuantityAdjustForm';
import type { QuantityAdjustDialogProps } from './QuantityAdjustDialog.types';

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
