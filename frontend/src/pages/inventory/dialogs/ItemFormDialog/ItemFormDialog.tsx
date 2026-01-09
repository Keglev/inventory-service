/**
 * ItemFormDialog - Main dialog container for item creation/editing
 * 
 * @module dialogs/ItemFormDialog/ItemFormDialog
 * @description
 * Manages dialog lifecycle (title, open/close, actions).
 * Delegates all form logic to useItemForm hook.
 * 
 * @enterprise
 * - Thin container following separation of concerns
 * - Dialog title changes: "Create Item" for new / "Edit Item" for existing
 * - Help button links to appropriate documentation section
 * - Cancel button dismisses without changes
 * - Save/Create button triggers submission with loading state
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';
import { ItemForm } from './ItemForm';
import { useItemForm } from './useItemForm';
import type { ItemFormDialogProps } from './ItemFormDialog.types';

/**
 * ItemFormDialog - Main dialog component
 * 
 * Opens when isOpen is true. Renders ItemForm and manages dialog actions.
 * All form state/queries/validation delegated to useItemForm hook.
 * 
 * @param isOpen - Whether dialog is visible
 * @param onClose - Called on cancel or successful save
 * @param initial - Initial item data (undefined for create mode)
 */
export function ItemFormDialog({
  isOpen,
  onClose,
  initial,
  onSaved,
}: ItemFormDialogProps) {
  const { t } = useTranslation(['common', 'inventory']);
  const dialogRef = useRef<HTMLDivElement>(null);

  // All form state and handlers delegated to hook
  const state = useItemForm({ isOpen, onClose, initial, onSaved });

  // Dialog title reflects create vs edit mode
  const dialogTitle = initial?.id
    ? t('inventory:dialogs.editItem', 'Edit Item')
    : t('inventory:dialogs.createItem', 'Create Item');

  // Button label also changes based on mode
  const submitLabel = initial?.id
    ? t('common:actions.save', 'Save')
    : t('common:actions.create', 'Create');

  return (
    <Dialog
      ref={dialogRef}
      open={isOpen}
      onClose={() => state.handleClose()}
      maxWidth="sm"
      fullWidth
    >
      {/* Title with help icon */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{dialogTitle}</span>
        <Tooltip title={t('common:help', 'Help')}>
          <IconButton
            size="small"
            onClick={() => {
              const section = initial?.id ? 'edit_item' : 'create_item';
              window.open(`#/help?section=${section}`, '_blank');
            }}
            aria-label="help"
          >
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      {/* Form content */}
      <DialogContent>
        <ItemForm state={state} initial={initial} />
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
              state.handleSubmit(state.onSubmit)(e);
            }}
            disabled={state.formState.isSubmitting}
          >
            {submitLabel}
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
