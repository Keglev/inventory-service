/**
 * @file useCreateSupplierForm.test.ts
 *
 * @what_is_under_test useCreateSupplierForm hook
 * @responsibility Manage form state, validation, and submission handlers
 * @out_of_scope Component rendering, API layer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../../../../api/suppliers', () => ({
  createSupplier: vi.fn(),
  createSupplierSchema: {
    parse: vi.fn((data) => data),
  },
}));

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleSubmit: (fn: any) => fn,
      setError: vi.fn(),
      formState: { errors: {}, isSubmitting: false },
      reset: vi.fn(),
    }),
  };
});

import { useCreateSupplierForm } from '../../../../../pages/suppliers/dialogs/CreateSupplierDialog/useCreateSupplierForm';

describe('useCreateSupplierForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty form state', () => {
    const { result } = renderHook(() => useCreateSupplierForm(vi.fn()));
    expect(result.current).toBeDefined();
    expect(result.current.formError).toBeNull();
  });

  it('provides register method', () => {
    const { result } = renderHook(() => useCreateSupplierForm(vi.fn()));
    expect(result.current.register).toBeDefined();
  });
});
