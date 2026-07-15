/**
 * @file useEditSupplierFormState.test.ts
 * @module __tests__/components/pages/suppliers/EditSupplierDialog/useEditSupplierFormState
 * @description Orchestration tests for `useEditSupplierFormState`.
 *
 * Contract under test:
 * - Provides a react-hook-form instance for `EditSupplierForm`.
 * - `populateWithSupplier()` maps SupplierRow -> form values.
 * - `reset()` restores default values and clears dirty state.
 *
 * Out of scope:
 * - API submission and confirmation flow.
 * - Schema validation rules (assertions are limited to state/value transitions).
 *
 * Test strategy:
 * - Use `handleSubmit()` to observe current form values after population/reset.
 */

import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { EditSupplierForm } from '../../../../../api/suppliers/validation';

import { useEditSupplierFormState } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierFormState';
import { supplierRow } from './fixtures';

const supplier = supplierRow({
  contactName: 'Janet Jones',
  phone: '555-8000',
  email: 'janet@acme.com',
});

describe('useEditSupplierFormState', () => {
  it('populates form fields with selected supplier values', async () => {
    const { result } = renderHook(() => useEditSupplierFormState());
    let submitted: EditSupplierForm | undefined;

    await act(async () => {
      result.current.populateWithSupplier(supplier);
      await result.current.handleSubmit((values) => {
        submitted = values;
      })();
    });

    expect(submitted).toEqual({
      supplierId: supplier.id,
      contactName: supplier.contactName,
      phone: supplier.phone,
      email: supplier.email,
    });
  });

  it('maps a supplier with no contact details through the empty-string fallback', async () => {
    // A supplier provisioned with only a name has null contact fields; the form
    // inputs are controlled and cannot hold null, so populate falls each back to ''.
    // contactName and phone submit as '' unchanged; email is different — an empty
    // string is not a valid address, so the schema's .email().catch(null) coerces
    // it back to null on submit. That asymmetry is intended, not a bug.
    const bare = supplierRow({ contactName: null, phone: null, email: null });
    const { result } = renderHook(() => useEditSupplierFormState());
    let submitted: EditSupplierForm | undefined;

    await act(async () => {
      result.current.populateWithSupplier(bare);
      await result.current.handleSubmit((values) => {
        submitted = values;
      })();
    });

    expect(submitted).toEqual({
      supplierId: bare.id,
      contactName: '',
      phone: '',
      email: null,
    });
  });

  it('resets form back to defaults', async () => {
    const { result } = renderHook(() => useEditSupplierFormState());
    const submitSpy = vi.fn();

    await act(async () => {
      result.current.populateWithSupplier(supplier);
      result.current.reset();
      await result.current.handleSubmit(submitSpy)();
    });

    expect(submitSpy).not.toHaveBeenCalled();
    expect(result.current.formState.errors).toEqual({});
    expect(result.current.formState.isDirty).toBe(false);
    expect(result.current.formState.dirtyFields).toEqual({});
    expect(result.current.formState.defaultValues).toMatchObject({
      supplierId: '',
      contactName: '',
      phone: '',
      email: '',
    });
  });
});
