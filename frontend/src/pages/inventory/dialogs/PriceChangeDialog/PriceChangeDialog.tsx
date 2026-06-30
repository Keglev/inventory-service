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
 * - Help-icon wiring uses window.open('#/help?section=...') instead of
 *   the in-app useHelp() drawer. Same divergence as ItemFormDialog
 *   tracked under CB-APP54; this site is tracked under CB-APP57 as a
 *   sibling.
 * - dialogRef is declared via useRef but never read. Sibling of the
 *   same dead-ref pattern in ItemFormDialog. Tracked under ST-APP15
 *   (extended to cover both sites).
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
  Tooltip,
  IconButton,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';
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
  // BUCKET: ST-APP15 (extended) -- dialogRef is never read. Remove the useRef and the ref prop on Dialog. Same as ItemFormDialog.
  const dialogRef = useRef<HTMLDivElement>(null);

  // All form state and handlers delegated to hook
  const state = usePriceChangeForm({ isOpen: open, onClose, onPriceChanged, readOnly });

  return (
    <Dialog
      ref={dialogRef}
      open={open}
      onClose={() => state.handleClose()}
      maxWidth="sm"
      fullWidth
    >
      {/* Title with help icon */}
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>{t('inventory:toolbar.changePrice', 'Change Price')}</Box>
          {/* BUCKET: CB-APP57 -- raw window.open bypasses in-app help. Switch to useHelp() to match EditItemDialog and DeleteItemDialog. Sibling of CB-APP54. */}
          <Tooltip title={t('common:help', 'Help')}>
            <IconButton
              size="small"
              onClick={() => {
                window.open('#/help?section=inventory.changePrice', '_blank');
              }}
              aria-label="help"
            >
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>

      {/* Form content */}
      <DialogContent dividers>
        <PriceChangeForm state={state} />
      </DialogContent>

      {/* Dialog actions */}
      <DialogActions>
        <Button onClick={() => state.handleClose()} disabled={state.formState.isSubmitting}>
          {t('common:actions.cancel', 'Cancel')}
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
                {t('common:saving', 'Saving...')}
              </>
            ) : (
              t('inventory:buttons.applyPriceChange', 'Apply Price Change')
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
