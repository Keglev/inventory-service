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

import { fieldErrorText } from '../../../../utils/fieldErrorText';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { CreateSupplierForm as CreateSupplierFormData } from '../../../../api/suppliers/validation';

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
  const { t } = useTranslation(['suppliers', 'errors']);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {formError && <Alert severity="error">{formError}</Alert>}

      {/* Supplier Name - Required */}
      <TextField
        {...register('name')}
        label={t('suppliers:table.name') + ' *'}
        placeholder={t('suppliers:form.namePlaceholder')}
        fullWidth
        error={Boolean(errors.name)}
        helperText={fieldErrorText(errors.name, t)}
        disabled={isSubmitting}
        autoFocus
      />

      {/* Contact Name - Optional */}
      <TextField
        {...register('contactName')}
        label={t('suppliers:table.contactName')}
        placeholder={t('suppliers:form.contactNamePlaceholder')}
        fullWidth
        error={Boolean(errors.contactName)}
        helperText={fieldErrorText(errors.contactName, t)}
        disabled={isSubmitting}
      />

      {/* Phone - Optional */}
      <TextField
        {...register('phone')}
        label={t('suppliers:table.phone')}
        placeholder={t('suppliers:form.phonePlaceholder')}
        fullWidth
        error={Boolean(errors.phone)}
        helperText={fieldErrorText(errors.phone, t)}
        disabled={isSubmitting}
      />

      {/* Email - Optional but validated */}
      <TextField
        {...register('email')}
        label={t('suppliers:table.email')}
        placeholder={t('suppliers:form.emailPlaceholder')}
        type="email"
        fullWidth
        error={Boolean(errors.email)}
        helperText={fieldErrorText(errors.email, t)}
        disabled={isSubmitting}
      />
    </Box>
  );
};

export { SupplierFormFields as CreateSupplierForm };
