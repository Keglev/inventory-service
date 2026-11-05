/**
 * @file CreateSupplierDialog.tsx
 * @module pages/suppliers/dialogs/CreateSupplierDialog/CreateSupplierDialog
 *
 * @summary
 * Dialog container for creating a new supplier.
 *
 * @enterprise
 * - Separation of concerns: dialog wrapper, form logic (useCreateSupplierForm),
 *   form view (CreateSupplierForm); this file owns the open/close/reset lifecycle
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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { HelpIconButton } from '../../../../features/help/components/HelpIconButton';
import { useCreateSupplierForm } from './useCreateSupplierForm';
import { SupplierFormFields } from './CreateSupplierForm';
import type { CreateSupplierDialogProps } from './CreateSupplierDialog.types';
import type { CreateSupplierForm } from '../../../../api/suppliers/validation';

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

  const form = useCreateSupplierForm(onCreated);

  const handleClose = React.useCallback(() => {
    form.reset();
    form.setFormError(null);
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `form` is a new object each render; its stable members are listed
  }, [form.reset, form.setFormError, onClose]);

  /**
   * Handle form submission and dialog close.
   */
  const handleSubmit = async (data: CreateSupplierForm) => {
    const result = await form.onSubmit(data);
    if (result.success) {
      handleClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>{t('suppliers:actions.create')}</Box>
          <HelpIconButton topicId="suppliers.manage" tooltip={t('common:actions.help')} />
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
        <Button onClick={handleClose} disabled={form.formState.isSubmitting}>
          {t('common:actions.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={form.handleSubmit(handleSubmit)}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting
            ? t('common:actions.creating')
            : t('suppliers:actions.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
