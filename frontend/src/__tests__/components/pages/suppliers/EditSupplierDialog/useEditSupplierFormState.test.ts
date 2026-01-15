/**
 * @file useEditSupplierFormState.test.ts
 *
 * @what_is_under_test useEditSupplierFormState hook
 * @responsibility Manage supplier edit form values and populate/reset helpers
 * @out_of_scope API submission, confirmation flow
 */

import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { SupplierRow } from '../../../../../api/suppliers/types';

import { useEditSupplierFormState } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierFormState';

const supplier: SupplierRow = {
  id: 'supplier-1',
  name: 'Acme Corp',
  contactName: 'Janet Jones',
  phone: '555-8000',
  email: 'janet@acme.com',
  createdBy: 'owner@example.com',
  createdAt: '2023-01-01',
};

describe('useEditSupplierFormState', () => {
  it('populates form fields with selected supplier values', async () => {
    const { result } = renderHook(() => useEditSupplierFormState());
    let submitted;

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
