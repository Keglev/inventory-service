/**
 * @file EditSupplierInfoStep.tsx
 * @module dialogs/EditSupplierDialog/EditSupplierInfoStep
 *
 * @summary
 * Step 2 component for editing supplier contact information.
 * Displays form fields for contact info (name is read-only).
 *
 * @enterprise
 * - Pure presentation component
 * - Supplier name is read-only (immutable constraint)
 * - Editable fields: contactName, phone, email
 * - React Hook Form integration
 */

import * as React from 'react';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import {
  Box,
  TextField,
  Typography,
  Alert,
  Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { EditSupplierForm } from '../../../../api/suppliers';
import type { SupplierRow } from '../../../../api/suppliers/types';

/**
 * Props for EditSupplierInfoStep component.
 *
 * @interface EditSupplierInfoStepProps
 */
interface EditSupplierInfoStepProps {
  /** Currently selected supplier */
  selectedSupplier: SupplierRow | null;
  /** React Hook Form control */
  control: Control<EditSupplierForm>;
  /** Form field errors */
  errors: FieldErrors<EditSupplierForm>;
  /** Whether form is submitting */
  isSubmitting: boolean;
}

/**
 * Step 2: Edit supplier contact information.
 *
 * Displays form fields for editable supplier info.
 * Supplier name is displayed but read-only.
 *
 * @component
 * @param props - Component props
 * @returns JSX element with form fields, or info message if no supplier selected
 *
 * @example
 * ```tsx
 * <EditSupplierInfoStep
 *   selectedSupplier={supplier}
 *   control={control}
 *   errors={errors}
 *   isSubmitting={isSubmitting}
 * />
 * ```
 */
export const EditSupplierInfoStep: React.FC<EditSupplierInfoStepProps> = ({
  selectedSupplier,
  control,
  errors,
  isSubmitting,
}) => {
  const { t } = useTranslation(['suppliers']);

  if (!selectedSupplier) {
    return (
      <Alert severity="info">
        {t('suppliers:search.selectSupplierFirst', 'Search and select a supplier to enable editing.')}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        {t('suppliers:steps.editInfo', 'Step 2: Edit Contact Information')}
      </Typography>

      {/* Supplier Name Display (Read-only) */}
      <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t('suppliers:table.name', 'Supplier Name')}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
          {selectedSupplier.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {t('suppliers:hints.nameCannotBeChanged', '(Cannot be changed)')}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Contact Name */}
      <Controller
        name="contactName"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label={t('suppliers:table.contactName', 'Contact Name')}
            placeholder={t('suppliers:form.contactNamePlaceholder', 'Enter contact name')}
            error={!!errors.contactName}
            helperText={errors.contactName?.message}
            disabled={isSubmitting}
            margin="normal"
          />
        )}
      />

      {/* Phone */}
      <Controller
        name="phone"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label={t('suppliers:table.phone', 'Phone')}
            placeholder={t('suppliers:form.phonePlaceholder', 'Enter phone number')}
            error={!!errors.phone}
            helperText={errors.phone?.message}
            disabled={isSubmitting}
            margin="normal"
          />
        )}
      />

      {/* Email */}
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            type="email"
            label={t('suppliers:table.email', 'Email')}
            placeholder={t('suppliers:form.emailPlaceholder', 'Enter email address')}
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={isSubmitting}
            margin="normal"
          />
        )}
      />
    </Box>
  );
};
