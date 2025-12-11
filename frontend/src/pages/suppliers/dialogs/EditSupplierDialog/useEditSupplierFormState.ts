/**
 * @file useEditSupplierFormState.ts
 * @module dialogs/EditSupplierDialog/useEditSupplierFormState
 *
 * @summary
 * Hook for managing supplier edit form state.
 * Handles form initialization, validation, and lifecycle.
 *
 * @enterprise
 * - React Hook Form with Zod validation
 * - Form reset and setValue management
 * - Supplier data pre-fill on selection
 * - Type-safe form methods
 */

import * as React from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { editSupplierSchema, type EditSupplierForm } from '../../../../api/suppliers';
import type { SupplierRow } from '../../../../api/suppliers/types';

/**
 * Hook return type for form state.
 *
 * @interface UseEditSupplierFormStateReturn
 */
export interface UseEditSupplierFormStateReturn {
  /** Register function for form fields */
  register: UseFormReturn<EditSupplierForm>['register'];
  /** Control object for controlled components */
  control: UseFormReturn<EditSupplierForm>['control'];
  /** Form state (errors, isDirty, isSubmitting, etc) */
  formState: UseFormReturn<EditSupplierForm>['formState'];
  /** Submit handler wrapper */
  handleSubmit: UseFormReturn<EditSupplierForm>['handleSubmit'];
  /** Set individual form field values */
  setValue: UseFormReturn<EditSupplierForm>['setValue'];
  /** Reset form to default values */
  reset: () => void;
  /** Populate form with supplier data */
  populateWithSupplier: (supplier: SupplierRow) => void;
}

/**
 * Hook for managing supplier edit form state.
 *
 * Manages:
 * - Form initialization with validation
 * - Form field registration
 * - Form state tracking
 * - Supplier data pre-fill
 * - Form reset
 *
 * @returns Form methods and state
 *
 * @example
 * ```ts
 * const { register, control, handleSubmit, formState } = useEditSupplierFormState();
 * ```
 */
export const useEditSupplierFormState = (): UseEditSupplierFormStateReturn => {
  const {
    register,
    control,
    handleSubmit,
    formState,
    reset,
    setValue,
  } = useForm<EditSupplierForm>({
    resolver: zodResolver(editSupplierSchema) as Resolver<EditSupplierForm>,
    defaultValues: {
      supplierId: '',
      contactName: '',
      phone: '',
      email: '',
    },
  });

  /**
   * Populate form with supplier data.
   * Pre-fills form fields when supplier is selected.
   */
  const populateWithSupplier = React.useCallback(
    (supplier: SupplierRow) => {
      setValue('supplierId', supplier.id);
      setValue('contactName', supplier.contactName || '');
      setValue('phone', supplier.phone || '');
      setValue('email', supplier.email || '');
    },
    [setValue]
  );

  return {
    register,
    control,
    handleSubmit,
    formState,
    setValue,
    reset,
    populateWithSupplier,
  };
};
