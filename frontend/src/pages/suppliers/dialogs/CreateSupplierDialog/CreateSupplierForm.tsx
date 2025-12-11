/**
 * @file CreateSupplierForm.tsx
 * @module dialogs/CreateSupplierDialog/CreateSupplierForm
 *
 * @summary
 * Form fields for supplier creation.
 * Pure presentation component with no business logic.
 *
 * @enterprise
 * - Stateless component receiving all props from parent
 * - Uses React Hook Form register for field binding
 * - Displays validation errors inline
 */

import * as React from 'react';
import { TextField, Box, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { CreateSupplierForm as CreateSupplierFormData } from '../../../../api/suppliers';

/**
 * Props for CreateSupplierForm component.
 * 
 * @interface CreateSupplierFormProps
 */
interface CreateSupplierFormProps {
  /** React Hook Form register function for binding fields */
  register: UseFormRegister<CreateSupplierFormData>;
  /** Field-level validation errors */
  errors: FieldErrors<CreateSupplierFormData>;
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** Form-level error message (e.g., server errors) */
  formError: string | null;
}

/**
 * Supplier creation form fields.
 * 
 * Renders 4 input fields:
 * - name (required)
 * - contactName (optional)
 * - phone (optional)
 * - email (optional, email-validated)
 * 
 * @component
 * @param props - Component props
 * @returns JSX element with form fields
 * 
 * @example
 * ```tsx
 * <SupplierFormFields
 *   register={register}
 *   errors={errors}
 *   isSubmitting={isSubmitting}
 *   formError={formError}
 * />
 * ```
 */
export const SupplierFormFields: React.FC<CreateSupplierFormProps> = ({
  register,
  errors,
  isSubmitting,
  formError,
}) => {
  const { t } = useTranslation(['suppliers']);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {formError && <Alert severity="error">{formError}</Alert>}

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
  );
};

export { SupplierFormFields as CreateSupplierForm };
