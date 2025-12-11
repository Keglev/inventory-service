/**
 * @file useCreateSupplierForm.ts
 * @module dialogs/CreateSupplierDialog/useCreateSupplierForm
 *
 * @summary
 * Form logic for creating a new supplier.
 * Handles validation, submission, and error mapping.
 *
 * @enterprise
 * - React Hook Form + Zod for type-safe validation
 * - Server error mapping to field-level errors
 * - Tolerant error handling (no throws)
 */

import * as React from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { createSupplier, createSupplierSchema, type CreateSupplierForm } from '../../../../api/suppliers';

/**
 * Hook return type for CreateSupplierForm.
 * 
 * @interface UseCreateSupplierFormReturn
 */
export interface UseCreateSupplierFormReturn {
  // React Hook Form methods
  register: UseFormReturn<CreateSupplierForm>['register'];
  handleSubmit: UseFormReturn<CreateSupplierForm>['handleSubmit'];
  formState: UseFormReturn<CreateSupplierForm>['formState'];
  reset: UseFormReturn<CreateSupplierForm>['reset'];

  // Custom state
  formError: string | null;
  setFormError: (error: string | null) => void;

  // Handlers
  onSubmit: (data: CreateSupplierForm) => Promise<{ success: boolean }>;
}

/**
 * Hook for supplier creation form logic.
 * 
 * Handles:
 * - Form validation with Zod schema
 * - Server error mapping to field/form errors
 * - Submission to backend
 * - Success/failure notification
 * 
 * @param onCreated - Callback when supplier is successfully created
 * @returns Form methods and submission handler
 */
export const useCreateSupplierForm = (
  onCreated: () => void
): UseCreateSupplierFormReturn => {
  const { t } = useTranslation(['common', 'suppliers', 'errors']);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState,
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

  /**
   * Map backend error messages to field or form errors.
   * Uses heuristics to improve UX by pinpointing issues.
   */
  const applyServerError = (message?: string | null): void => {
    if (!message) return;
    const msg = message.toLowerCase();

    // Duplicate name error
    if (
      msg.includes('name') &&
      (msg.includes('duplicate') || msg.includes('exists') || msg.includes('already'))
    ) {
      setError('name', {
        message: t(
          'errors:supplier.businessRules.duplicateName',
          'A supplier with this name already exists'
        ),
      });
      setFormError(
        t('errors:inventory.validationFailed', 'Please fix the highlighted fields.')
      );
      return;
    }

    // Generic form error
    setFormError(message);
  };

  /**
   * Submit form: validate → POST → notify parent.
   */
  const onSubmit = async (data: CreateSupplierForm): Promise<{ success: boolean }> => {
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
        return { success: false };
      }

      // Success: notify parent and reset
      reset();
      onCreated();
      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t('errors:supplier.requests.failedToAddSupplier');
      applyServerError(errorMessage);
      return { success: false };
    }
  };

  return {
    register,
    handleSubmit,
    formState,
    reset,
    formError,
    setFormError,
    onSubmit,
  };
};
