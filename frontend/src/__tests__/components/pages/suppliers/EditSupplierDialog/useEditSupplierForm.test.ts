/**
 * @file useEditSupplierForm.test.ts
 * @module __tests__/components/pages/suppliers/EditSupplierDialog/useEditSupplierForm
 * @description Orchestration tests for the `useEditSupplierForm` workflow hook.
 *
 * Contract under test:
 * - Composes state from delegated hooks:
 *   - `useSupplierSearch` for query/results/loading
 *   - `useEditSupplierFormState` for RHF bindings + populate/reset helpers
 *   - `useEditSupplierConfirmation` for confirmation/pending change payload
 * - Selecting a supplier:
 *   - sets `selectedSupplier`
 *   - calls `populateWithSupplier(supplier)`
 *   - resets search
 *   - clears `formError`
 * - Confirming changes:
 *   - requires both `pendingChanges` and `selectedSupplier`
 *   - delegates persistence to `updateSupplier`
 *   - maps failures via `mapSupplierError` and closes confirmation
 * - Resetting the form:
 *   - clears selection + error
 *   - resets search, confirmation state, and form state
 *
 * Out of scope:
 * - UI rendering and toast wiring (validated by `EditSupplierDialog` component tests).
 * - i18n key correctness (we assert fallback strings).
 *
 * Test strategy:
 * - Deterministic, hoisted mocks for all dependencies.
 * - Assert observable state transitions and dependency calls (not internal React state).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { SupplierRow } from '../../../../../api/suppliers/types';
import type { EditSupplierForm } from '../../../../../api/suppliers';

import { editSupplierChanges, supplierRow } from './fixtures';
import {
  setupUseEditSupplierFormDeps,
  type UseEditSupplierFormMockContainer,
} from './testHelpers';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useSupplierSearch: vi.fn(),
  useEditSupplierFormState: vi.fn(),
  useEditSupplierConfirmation: vi.fn(),
  updateSupplier: vi.fn(),
  mapSupplierError: vi.fn((msg?: string | null, t?: TFunction) => {
    void t;
    return `mapped:${msg ?? 'unknown'}`;
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

vi.mock('../../../../../hooks/useAuth', () => ({
  useAuth: () => mocks.useAuth(),
}));

vi.mock('../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/useSupplierSearch', () => ({
  useSupplierSearch: () => mocks.useSupplierSearch(),
}));

vi.mock('../../../../../pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierFormState', () => ({
  useEditSupplierFormState: () => mocks.useEditSupplierFormState(),
}));

vi.mock('../../../../../pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierConfirmation', () => ({
  useEditSupplierConfirmation: () => mocks.useEditSupplierConfirmation(),
}));

vi.mock('../../../../../pages/suppliers/dialogs/EditSupplierDialog/mapSupplierErrors', () => ({
  mapSupplierError: (errorMsg: string | null | undefined, t: TFunction) =>
    mocks.mapSupplierError(errorMsg, t),
}));

vi.mock('../../../../../api/suppliers', () => ({
  updateSupplier: (...args: unknown[]) => mocks.updateSupplier(...args),
}));

import { useEditSupplierForm } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierForm';

const supplier: SupplierRow = supplierRow({ phone: '555-9000', email: 'old@acme.com' });
const pendingChanges: EditSupplierForm = editSupplierChanges({ supplierId: supplier.id, phone: '555-9100' });

type Deps = ReturnType<typeof setupUseEditSupplierFormDeps>;

let searchState: Deps['searchState'];
let formState: Deps['formState'];
let confirmationState: Deps['confirmationState'];

const renderForm = (onUpdated: () => void = vi.fn()) =>
  renderHook(() => useEditSupplierForm(onUpdated));

const selectSupplier = (result: ReturnType<typeof renderForm>['result']) => {
  act(() => {
    result.current.onSelectSupplierAndLoadForm(supplier);
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  // Centralized harness: creates concrete state objects and installs dependency mocks.
  ({ searchState, formState, confirmationState } = setupUseEditSupplierFormDeps(
    mocks as UseEditSupplierFormMockContainer
  ));
});

describe('useEditSupplierForm', () => {
  it('selects supplier, populates form, and clears search', () => {
    const onUpdated = vi.fn();
    const { result } = renderForm(onUpdated);

    selectSupplier(result);

    expect(result.current.selectedSupplier).toEqual(supplier);
    expect(formState.populateWithSupplier).toHaveBeenCalledWith(supplier);
    expect(searchState.resetSearch).toHaveBeenCalled();
    expect(result.current.formError).toBe('');
  });

  it('does not submit when prerequisites are missing', async () => {
    const { result } = renderForm();

    await act(async () => {
      await result.current.handleConfirmChanges();
    });

    expect(mocks.updateSupplier).not.toHaveBeenCalled();
  });

  it('submits updates and calls onUpdated on success', async () => {
    const onUpdated = vi.fn();
    const { result } = renderForm(onUpdated);

    selectSupplier(result);
    // This hook gates submission on a pending payload + selected supplier.
    confirmationState.pendingChanges = pendingChanges;
    mocks.updateSupplier.mockResolvedValue({ success: true });

    await act(async () => {
      await result.current.handleConfirmChanges();
    });

    expect(mocks.updateSupplier).toHaveBeenCalledWith(supplier.id, {
      name: supplier.name,
      createdBy: 'admin@example.com',
      contactName: pendingChanges.contactName,
      phone: pendingChanges.phone,
      email: pendingChanges.email,
    });
    expect(onUpdated).toHaveBeenCalledTimes(1);
    expect(mocks.mapSupplierError).not.toHaveBeenCalled();
  });

  it('maps API error when update fails', async () => {
    const { result } = renderForm();

    selectSupplier(result);
    confirmationState.pendingChanges = pendingChanges;
    mocks.mapSupplierError.mockReturnValueOnce('Duplicate email error');
    mocks.updateSupplier.mockResolvedValue({ success: false, error: 'duplicate' });

    await act(async () => {
      await result.current.handleConfirmChanges();
    });

    expect(mocks.mapSupplierError).toHaveBeenCalledWith('duplicate', expect.any(Function));
    expect(result.current.formError).toBe('Duplicate email error');
    expect(confirmationState.setShowConfirmation).toHaveBeenCalledWith(false);
    expect(searchState.resetSearch).toHaveBeenCalledTimes(1);
  });

  it('handles thrown errors during update', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderForm();

    selectSupplier(result);
    confirmationState.pendingChanges = pendingChanges;
    mocks.mapSupplierError.mockReturnValueOnce('Network failure');
    mocks.updateSupplier.mockRejectedValue(new Error('network down'));

    await act(async () => {
      await result.current.handleConfirmChanges();
    });

    expect(mocks.mapSupplierError).toHaveBeenCalledWith('network down', expect.any(Function));
    expect(result.current.formError).toBe('Network failure');
    expect(confirmationState.setShowConfirmation).toHaveBeenCalledWith(false);
    consoleSpy.mockRestore();
  });

  it('resets search, confirmation, and form state when resetForm is called', () => {
    const { result } = renderForm();

    act(() => {
      result.current.onSelectSupplierAndLoadForm(supplier);
      result.current.setFormError('Bad things happened');
    });
    expect(result.current.formError).toBe('Bad things happened');

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.selectedSupplier).toBeNull();
    expect(result.current.formError).toBe('');
    expect(searchState.resetSearch).toHaveBeenCalled();
    expect(confirmationState.reset).toHaveBeenCalled();
    expect(formState.reset).toHaveBeenCalled();
  });
});

