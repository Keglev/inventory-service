/**
 * PriceChangeDialog - Main dialog container for price adjustment
 * 
 * @module dialogs/PriceChangeDialog/PriceChangeDialog
 * @description
 * Manages dialog lifecycle (title, open/close, actions).
 * Delegates all form logic to usePriceChangeForm hook.
 * 
 * @enterprise
 * - Thin container following separation of concerns
 * - Help button links to price change documentation
 * - Cancel button dismisses without changes
 * - Apply button triggers submission with loading state
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

/**
 * PriceChangeDialog - Main dialog component
 * 
 * Opens when open is true. Renders PriceChangeForm and manages dialog actions.
 * All form state/queries/validation delegated to usePriceChangeForm hook.
 * 
 * @param open - Whether dialog is visible
 * @param onClose - Called on cancel or successful save
 * @param onPriceChanged - Called after successful price change
 * @param readOnly - Demo mode flag (disables submission)
 */
export function PriceChangeDialog({
  open,
  onClose,
  onPriceChanged,
  readOnly = false,
}: PriceChangeDialogProps) {
  const { t } = useTranslation(['common', 'inventory']);
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
