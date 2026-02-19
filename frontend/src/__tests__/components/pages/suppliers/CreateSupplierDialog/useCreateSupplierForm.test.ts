/**
 * @file useCreateSupplierForm.test.ts
 * @module __tests__/components/pages/suppliers/CreateSupplierDialog/useCreateSupplierForm
 * @description Orchestration tests for the `useCreateSupplierForm` hook.
 *
 * Contract under test:
 * - Exposes a stable React Hook Form surface (`register`, `handleSubmit`, `formState`, `reset`).
 * - On successful submit:
 *   - calls `createSupplier` with the submitted payload,
 *   - resets the form,
 *   - invokes the provided `onCreated` callback,
 *   - and reports `{ success: true }`.
 * - On duplicate-name business rule failures:
 *   - maps error to the `name` field via `setError`,
 *   - sets a user-facing banner error,
 *   - and reports `{ success: false }` without calling `onCreated`.
 * - On unexpected thrown values:
 *   - sets a generic banner error,
 *   - and reports `{ success: false }`.
 *
 * Out of scope:
 * - Zod schema validation details (tested elsewhere; mocked here to keep the suite deterministic).
 * - UI rendering (covered by component contract tests).
 *
 * Test strategy:
 * - Deterministic `vi.hoisted` mocks for effectful dependencies (`createSupplier`, RHF `setError/reset`).
 * - `zodResolver` is mocked to avoid coupling tests to schema internals.
 * - We do not duplicate production heuristics; we only assert observable outcomes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { CreateSupplierForm } from '../../../../../api/suppliers';

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
const mocks = vi.hoisted(() => ({
  createSupplier: vi.fn(),
  register: vi.fn(),
  reset: vi.fn(),
  setError: vi.fn(),
}));

vi.mock('../../../../../api/suppliers', () => ({
  // The hook is the orchestration unit; the API layer is mocked deterministically.
  createSupplier: (...args: [unknown]) => mocks.createSupplier(...args),
  createSupplierSchema: {},
}));

vi.mock('@hookform/resolvers/zod', () => ({
  // Avoid schema coupling: the hook wires a resolver, but schema behavior is not under test here.
  zodResolver: () => () => ({ values: {}, errors: {} }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Prefer defaultValue when provided; otherwise return key.
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

vi.mock('react-hook-form', () => {
  return {
    useForm: () => ({
      register: mocks.register,
      // The hook passes a callback into RHF; in this suite we test `onSubmit` directly.
      handleSubmit: ((onValid: unknown) => onValid) as unknown,
      setError: mocks.setError,
      formState: { errors: {}, isSubmitting: false },
      reset: mocks.reset,
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

  it('submits successfully: calls API, resets, and notifies parent', async () => {
    const onCreated = vi.fn();
    const data: CreateSupplierForm = {
      name: 'Acme Inc.',
      contactName: 'Jane Doe',
      phone: '555-1234',
      email: 'jane@example.com',
    };
    mocks.createSupplier.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useCreateSupplierForm(onCreated));

    await act(async () => {
      const submitResult = await result.current.onSubmit(data);
      expect(submitResult).toEqual({ success: true });
    });

    // API call must receive the exact payload (no hidden transforms).
    expect(mocks.createSupplier).toHaveBeenCalledWith(
      expect.objectContaining({
        name: data.name,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
      })
    );
    expect(mocks.reset).toHaveBeenCalledTimes(1);
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(result.current.formError).toBeNull();
  });

  it('maps duplicate-name server error to name field + banner error', async () => {
    const onCreated = vi.fn();
    mocks.createSupplier.mockResolvedValue({
      success: false,
      error: 'Duplicate name already exists',
    });

    const { result } = renderHook(() => useCreateSupplierForm(onCreated));

    await act(async () => {
      const submitResult = await result.current.onSubmit({
        name: 'Acme Inc.',
        contactName: '',
        phone: '',
        email: '',
      });
      expect(submitResult).toEqual({ success: false });
    });

    // Heuristic mapping contract: duplicate-name errors must highlight the "name" field.
    expect(mocks.setError).toHaveBeenCalledWith(
      'name',
      expect.objectContaining({ message: expect.any(String) })
    );

    // Banner error is a stable UX string provided via i18n defaultValue.
    expect(result.current.formError).toBe('Please fix the highlighted fields.');
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('handles thrown non-Error values by setting a generic form error', async () => {
    mocks.createSupplier.mockRejectedValue('boom');

    const { result } = renderHook(() => useCreateSupplierForm(vi.fn()));

    await act(async () => {
      const submitResult = await result.current.onSubmit({
        name: 'Acme Inc.',
        contactName: '',
        phone: '',
        email: '',
      });
      expect(submitResult).toEqual({ success: false });
    });

    // When the thrown value is not an Error, the hook falls back to a translated generic message.
    expect(result.current.formError).toBe('errors:supplier.requests.failedToAddSupplier');
  });
});
