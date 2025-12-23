/**
 * @file useEditSupplierFormState.test.ts
 *
 * @what_is_under_test useEditSupplierFormState hook
 * @responsibility Manage form state, validation, and supplier data pre-fill
 * @out_of_scope Component rendering, API layer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

vi.mock('react-hook-form', () => {
  const actual = vi.importActual('react-hook-form');
  return {
    ...actual,
    useForm: () => ({
      register: vi.fn(),
      control: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleSubmit: (fn: any) => fn,
      formState: { errors: {}, isSubmitting: false },
      reset: vi.fn(),
      setValue: vi.fn(),
    }),
  };
});

vi.mock('../../../../api/suppliers', () => ({
  editSupplierSchema: {},
}));

import { useEditSupplierFormState } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierFormState';

describe('useEditSupplierFormState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with form methods', () => {
    const { result } = renderHook(() => useEditSupplierFormState());
    expect(result.current).toBeDefined();
    expect(result.current.register).toBeDefined();
    expect(result.current.control).toBeDefined();
  });

  it('provides form state object', () => {
    const { result } = renderHook(() => useEditSupplierFormState());
    expect(result.current.formState).toBeDefined();
  });

  it('provides reset function', () => {
    const { result } = renderHook(() => useEditSupplierFormState());
    expect(result.current.reset).toBeDefined();
  });

  it('provides populateWithSupplier function', () => {
    const { result } = renderHook(() => useEditSupplierFormState());
    expect(result.current.populateWithSupplier).toBeDefined();
  });
});
