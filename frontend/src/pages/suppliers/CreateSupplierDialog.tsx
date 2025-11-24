/**
 * @file CreateSupplierDialog.tsx
 * @module pages/suppliers/CreateSupplierDialog
 *
 * @summary
 * Dialog for creating a new supplier with form validation.
 *
 * @remarks
 * - Built with React Hook Form + Zod for robust, typed client validation.
 * - Error handling maps backend messages to field or form errors.
 * - Optional fields: contactName, phone, email
 * - Required field: name (non-blank)
 * - Email validation if provided
 *
 * @enterprise
 * - **Resilience:** Network/mutation calls never throw; errors surface as user-friendly form messages
 * - **i18n discipline:** Keys live under 'common', 'suppliers', and 'errors' namespaces
 * - **Maintainability:** Extensive TypeDoc + inline comments explain business intent
 */

import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { createSupplier } from '../../api/suppliers';

/**
 * Validation schema for supplier creation using Zod.
 * Constraints based on SupplierValidator and API documentation.
 */
const createSupplierSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .trim(),
  contactName: z
    .string()
    .optional()
    .transform((v) => v || null),
  phone: z
    .string()
    .optional()
    .transform((v) => v || null),
  email: z
    .string()
    .email('Invalid email format')
    .optional()
    .transform((v) => v || null),
});

type CreateSupplierForm = z.infer<typeof createSupplierSchema>;

/**
 * Props for {@link CreateSupplierDialog}.
 */
export interface CreateSupplierDialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called when the user cancels or after a successful save. */
  onClose: () => void;
  /**
   * Called after a successful save.
   * Parent typically reloads the list and shows a toast.
   */
  onCreated: () => void;
}

/**
 * Dialog for creating a new supplier.
 *
 * @remarks
 * Key UX decisions:
 * - Name is required (non-blank)
 * - Contact name, phone, and email are optional
 * - Email is validated if provided
 * - On successful creation, parent is notified to reload list
 * - Form errors are displayed inline per field or as a banner
 */
export const CreateSupplierDialog: React.FC<CreateSupplierDialogProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const { t } = useTranslation(['common', 'suppliers', 'errors']);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateSupplierForm>({
    resolver: zodResolver(createSupplierSchema) as Resolver<CreateSupplierForm>,
    defaultValues: {
      name: '',
      contactName: '',
      phone: '',
      email: '',
    },
  });

  const [formError, setFormError] = React.useState<string | null>(null);

  /**
   * Reset form when dialog opens/closes.
   * @enterprise Ensures predictable state for new supplier creation.
   */
  React.useEffect(() => {
    if (!open) return;
    reset({
      name: '',
      contactName: '',
      phone: '',
      email: '',
    });
    setFormError(null);
    clearErrors();
  }, [open, reset, clearErrors]);

  /**
   * Try to convert a generic backend error string into field or form errors.
   * @remarks
   * Backend may return a flat `message` string. We use heuristics to improve UX.
   */
  function applyServerError(message?: string | null): void {
    if (!message) return;
    const msg = message.toLowerCase();

    // Duplicate name
    if (msg.includes('name') && (msg.includes('duplicate') || msg.includes('exists') || msg.includes('already'))) {
      setError('name', {
        message: t(
          'errors:supplier.businessRules.duplicateName',
          'A supplier with this name already exists'
        ),
      });
      setFormError(t('errors:inventory.validationFailed', 'Please fix the highlighted fields.'));
      return;
    }

    // Generic form error
    setFormError(message);
  }

  /**
   * Handle form submission: validate → POST /api/suppliers → notify parent.
   */
  const onSubmit = async (data: CreateSupplierForm) => {
    setFormError(null);

    try {
      const response = await createSupplier({
        name: data.name,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
      });

      if (!response.success) {
        applyServerError(response.error);
        return;
      }

      // Success: close dialog and notify parent
      reset();
      onCreated();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('errors:supplier.requests.failedToAddSupplier');
      applyServerError(errorMessage);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('suppliers:actions.create', 'Create Supplier')}</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Supplier Name - Required */}
          <TextField
            {...register('name')}
            label={t('suppliers:table.name', 'Supplier Name') + ' *'}
            placeholder={t('suppliers:form.namePlaceholder', 'Enter supplier name')}
            fullWidth
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            disabled={isSubmitting}
            autoFocus
          />

          {/* Contact Name - Optional */}
          <TextField
            {...register('contactName')}
            label={t('suppliers:table.contactName', 'Contact Person')}
            placeholder={t('suppliers:form.contactNamePlaceholder', 'Enter contact name')}
            fullWidth
            error={Boolean(errors.contactName)}
            helperText={errors.contactName?.message}
            disabled={isSubmitting}
          />

          {/* Phone - Optional */}
          <TextField
            {...register('phone')}
            label={t('suppliers:table.phone', 'Phone')}
            placeholder={t('suppliers:form.phonePlaceholder', 'Enter phone number')}
            fullWidth
            error={Boolean(errors.phone)}
            helperText={errors.phone?.message}
            disabled={isSubmitting}
          />

          {/* Email - Optional but validated */}
          <TextField
            {...register('email')}
            label={t('suppliers:table.email', 'Email')}
            placeholder={t('suppliers:form.emailPlaceholder', 'Enter email address')}
            type="email"
            fullWidth
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            disabled={isSubmitting}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          {t('common:actions.cancel', 'Cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? t('common:actions.creating', 'Creating...')
            : t('suppliers:actions.create', 'Create Supplier')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateSupplierDialog;
