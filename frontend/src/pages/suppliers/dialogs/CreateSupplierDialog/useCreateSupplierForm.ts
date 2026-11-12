/**
 * @file useCreateSupplierForm.ts
 * @module pages/suppliers/dialogs/CreateSupplierDialog/useCreateSupplierForm
 *
 * @summary
 * Form logic for creating a new supplier.
 *
 * @enterprise
 * Handles validation, submission, and error mapping.
 *
 * - React Hook Form + Zod for type-safe validation
 * - Server error mapping to field-level errors
 * - Tolerant error handling (no throws)
 */

import * as React from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { createSupplier } from '../../../../api/suppliers/supplierMutations';
import { createSupplierSchema, type CreateSupplierForm } from '../../../../api/suppliers/validation';
import {
  isSupplierNameConflict,
  supplierErrorMessage,
  type SupplierErrorEnvelope,
} from '../supplierServerErrors';

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
 * Handles Zod validation, the POST, and mapping a server error to a field or the
 * form banner; the parent's onCreated reports success.
 * 
 * @param onCreated - Callback when supplier is successfully created
 * @param readOnly - Demo session: a valid submit shows the demo message and sends no request
 * @returns Form methods and submission handler
 */
export const useCreateSupplierForm = (
  onCreated: () => void,
  readOnly = false
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
   * Attach a failed create to the offending input, or to the form banner.
   * Classification comes from the structured envelope, never from message text.
   */
  const applyServerError = (failure: SupplierErrorEnvelope): void => {
    if (isSupplierNameConflict(failure)) {
      setError('name', { message: 'errors:supplier.businessRules.duplicateName' });
      setFormError(t('errors:form.validationFailed'));
      return;
    }

    setFormError(supplierErrorMessage(failure, t, 'add'));
  };

  const onSubmit = async (data: CreateSupplierForm): Promise<{ success: boolean }> => {
    if (readOnly) {
      setFormError(t('common:demoDisabled'));
      return { success: false };
    }

    setFormError(null);

    try {
      const response = await createSupplier({
        name: data.name,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
      });

      if (!response.success) {
        applyServerError(response);
        return { success: false };
      }

      reset();
      onCreated();
      return { success: true };
    } catch {
      // The fetcher already converts transport failures into a result; reaching
      // here means something outside the request threw, so there is no envelope.
      applyServerError({});
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
