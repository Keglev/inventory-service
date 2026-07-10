/**
 * @file PriceChangeDialog.tsx
 * @module pages/inventory/dialogs/PriceChangeDialog/PriceChangeDialog
 *
 * @summary
 * Root dialog for the price-change flow. Renders title, the
 * PriceChangeForm body, and the cancel/apply actions. All state and
 * submission live in usePriceChangeForm.
 *
 * @enterprise
 * - Single-dialog architecture. Price change is reversible by another
 *   price change, so no second confirmation step is offered. Same
 *   pattern as EditItemDialog (rename), different from DeleteItemDialog
 *   (two-dialog with confirmation).
 * - Backend invariants surfaced in the UI:
 *   (1) newPrice must be > 0 (priceChangeSchema enforces, backend
 *       re-validates);
 *   (2) backend does not record a reason for price changes, so the form
 *       carries no reason field.
 * - Help opens the in-app drawer via the shared HelpIconButton component,
 *   matching ItemFormDialog (CB-APP54 closure). This site is tracked
 *   under CB-APP57 as a sibling.
 * - There is no substring error-mapping in this flow. Failures get a
 *   single generic message regardless of cause (admin-only, validation,
 *   conflict). Tracked under CB-APP56 -- either add structured error
 *   mapping consistent with delete/rename/create flows, or accept the
 *   generic message as policy.
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Stack,
} from '@mui/material';
import { HelpIconButton } from '../../../../features/help/components/HelpIconButton';
import { useTranslation } from 'react-i18next';
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

  // All form state and handlers delegated to hook
  const state = usePriceChangeForm({ isOpen: open, onClose, onPriceChanged, readOnly });

  return (
    <Dialog
      open={open}
      onClose={() => state.handleClose()}
      maxWidth="sm"
      fullWidth
    >
      {/* Title with help icon */}
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>{t('inventory:toolbar.changePrice')}</Box>
          <HelpIconButton topicId="inventory.changePrice" tooltip={t('common:actions.help')} />
        </Stack>
      </DialogTitle>

      {/* Form content */}
      <DialogContent dividers>
        <PriceChangeForm state={state} />
      </DialogContent>

      {/* Dialog actions */}
      <DialogActions>
        <Button onClick={() => state.handleClose()} disabled={state.formState.isSubmitting}>
          {t('common:actions.cancel')}
        </Button>
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <Button
            variant="contained"
            onClick={(e) => {
              e.preventDefault();
              state.onSubmit();
            }}
            disabled={state.formState.isSubmitting || !state.selectedItem}
            data-testid="apply-price-change-button"
          >
            {state.formState.isSubmitting ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                {t('common:actions.saving')}
              </>
            ) : (
              t('inventory:buttons.applyPriceChange')
            )}
          </Button>
          {state.formState.isSubmitting && (
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px',
              }}
            />
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
