/**
 * @file CreateSupplierDialog.tsx
 * @module dialogs/CreateSupplierDialog/CreateSupplierDialog
 *
 * @summary
 * Dialog container for creating a new supplier.
 * Composes form logic hook and form view component.
 *
 * @enterprise
 * - Separation of concerns: Dialog wrapper, form logic, form view
 * - Orchestrates form lifecycle (open/close/reset)
 * - Clean, readable component hierarchy
 */

import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTranslation } from 'react-i18next';
import { useHelp } from '../../../../hooks/useHelp';
import { useCreateSupplierForm } from './useCreateSupplierForm';
import { SupplierFormFields } from './CreateSupplierForm';
import type { CreateSupplierDialogProps } from './CreateSupplierDialog.types';
import type { CreateSupplierForm } from '../../../../api/suppliers';

/**
 * Dialog for creating a new supplier.
 *
 * @remarks
 * Key UX decisions:
 * - Name is required (non-blank)
 * - Contact name, phone, and email are optional
 * - Email is validated if provided
 * - On successful creation, parent is notified via onCreated callback
 * - Form errors are displayed inline per field or as a banner
 * 
 * @component
 * @param props - Dialog props
 * @returns JSX element with dialog and form
 * 
 * @example
 * ```tsx
 * <CreateSupplierDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onCreated={handleSupplierCreated}
 * />
 * ```
 */
export const CreateSupplierDialog: React.FC<CreateSupplierDialogProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const { t } = useTranslation(['common', 'suppliers']);
  const { openHelp } = useHelp();

  // Form logic hook
  const form = useCreateSupplierForm(onCreated);

  /**
   * Reset form when dialog opens.
   * Ensures clean state for new supplier creation.
   */
  React.useEffect(() => {
    if (!open) return;
    form.reset();
    form.setFormError(null);
  }, [open, form]);

  /**
   * Handle form submission and dialog close.
   */
  const handleSubmit = async (data: CreateSupplierForm) => {
    const result = await form.onSubmit(data);
    if (result.success) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>{t('suppliers:actions.create', 'Create Supplier')}</Box>
          <Tooltip title={t('actions.help', 'Help')}>
            <IconButton size="small" onClick={() => openHelp('suppliers.manage')}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 3.5 }}>
        <SupplierFormFields
          register={form.register}
          errors={form.formState.errors}
          isSubmitting={form.formState.isSubmitting}
          formError={form.formError}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={form.formState.isSubmitting}>
          {t('common:actions.cancel', 'Cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={form.handleSubmit(handleSubmit)}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting
            ? t('common:actions.creating', 'Creating...')
            : t('suppliers:actions.create', 'Create Supplier')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateSupplierDialog;
