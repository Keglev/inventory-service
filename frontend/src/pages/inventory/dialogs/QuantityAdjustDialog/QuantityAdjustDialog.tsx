/**
 * @file QuantityAdjustDialog.tsx
 * @module pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustDialog
 *
 * @summary
 * Root dialog for the quantity-adjust flow: title, form body, and cancel/apply actions.
 *
 * @enterprise
 * - All state and submission live in useQuantityAdjustForm.
 * - Single-dialog architecture. A quantity adjustment is reversible
 *   by another adjustment, so no second confirmation step is offered.
 *   Same pattern as EditItemDialog and PriceChangeDialog.
 * - Help opens through the shared HelpIconButton, as in every dialog.
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

  const form = useQuantityAdjustForm(open, onClose, onAdjusted, readOnly);

  return (
    <Dialog open={open} onClose={form.handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>{t('inventory:toolbar.adjustQty')}</Box>
          <HelpIconButton
            topicId="inventory.adjustQuantity"
            tooltip={t('actions.help')}
          />
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <QuantityAdjustForm form={form} />
      </DialogContent>

      <DialogActions>
        <Button onClick={form.handleClose} disabled={form.formState.isSubmitting}>
          {t('common:actions.cancel')}
        </Button>
        <Button
          onClick={form.onSubmit}
          disabled={form.formState.isSubmitting || !form.selectedItem}
          variant="contained"
        >
          {form.formState.isSubmitting ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              {t('common:actions.saving')}
            </>
          ) : (
            t('inventory:buttons.applyAdjustment')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
