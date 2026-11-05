/**
 * @file PriceChangeDialog.tsx
 * @module pages/inventory/dialogs/PriceChangeDialog/PriceChangeDialog
 *
 * @summary
 * Root dialog for the price-change flow: title, the PriceChangeForm body, and the
 * cancel/apply actions.
 *
 * @enterprise
 * - All state and submission live in usePriceChangeForm.
 * - Single-dialog architecture. Price change is reversible by another
 *   price change, so no second confirmation step is offered. Same
 *   pattern as EditItemDialog (rename), different from DeleteItemDialog
 *   (two-dialog with confirmation).
 * - Backend invariants surfaced in the UI:
 *   (1) newPrice must be > 0 (priceChangeSchema enforces, backend
 *       re-validates);
 *   (2) the backend records the change as PRICE_CHANGE itself, so the
 *       form carries no reason field.
 * - Help opens the in-app drawer via the shared HelpIconButton component,
 *   matching ItemFormDialog.
 * - Failures map by the backend status token in usePriceChangeForm
 *   ('forbidden' -> admin-only, 'not_found' -> item gone, else a generic
 *   message), never by substrings of the message.
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  CircularProgress,
  Stack,
} from '@mui/material';
import { HelpIconButton } from '../../../../features/help/components/HelpIconButton';
import { useTranslation } from 'react-i18next';
import { SubmitDialogActions } from '../SubmitDialogActions';
import { PriceChangeForm } from './PriceChangeForm';
import { usePriceChangeForm } from './usePriceChangeForm';
import type { PriceChangeDialogProps } from './PriceChangeDialog.types';

export function PriceChangeDialog({
  open,
  onClose,
  onPriceChanged,
  readOnly = false,
}: PriceChangeDialogProps) {
  const { t } = useTranslation(['common', 'inventory']);

  const state = usePriceChangeForm({ isOpen: open, onClose, onPriceChanged, readOnly });

  return (
    <Dialog
      open={open}
      onClose={() => state.handleClose()}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>{t('inventory:toolbar.changePrice')}</Box>
          <HelpIconButton topicId="inventory.changePrice" tooltip={t('common:actions.help')} />
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <PriceChangeForm state={state} />
      </DialogContent>

      <SubmitDialogActions
        onCancel={() => state.handleClose()}
        onSubmit={() => state.onSubmit()}
        submitting={state.formState.isSubmitting}
        submitDisabled={!state.selectedItem}
        submitTestId="apply-price-change-button"
        submitLabel={
          state.formState.isSubmitting ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              {t('common:actions.saving')}
            </>
          ) : (
            t('inventory:buttons.applyPriceChange')
          )
        }
      />
    </Dialog>
  );
}
