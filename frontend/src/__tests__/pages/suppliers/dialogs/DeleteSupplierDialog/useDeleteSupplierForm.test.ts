/**
 * @file useDeleteSupplierForm.test.ts
 * @module __tests__/pages/suppliers/dialogs/DeleteSupplierDialog/useDeleteSupplierForm
 * @description Orchestration tests for the `useDeleteSupplierForm` workflow hook.
 *
 * Contract under test:
 * - Composes search state from `useSupplierSearch`.
 * - Selecting a supplier:
 *   - sets `selectedSupplier`,
 *   - clears any prior error,
 *   - resets search,
 *   - and enters confirmation mode.
 * - Confirm delete enforces preconditions:
 *   - requires a selected supplier,
 *   - requires ADMIN role.
 * - On successful delete, calls the provided `onDeleted` callback.
 * - On failed/blocked deletes, surfaces a user-facing error message and resets loading state;
 *   a thrown request is also logged (logError), captured so it asserts instead of printing.
 *
 * Out of scope:
 * - UI rendering (dialog steps are covered by component tests).
 * - Exhaustive server error heuristics (we assert representative outcomes only).
 *
 * Test strategy:
 * - Deterministic, hoisted mocks for `deleteSupplier`, `useAuth`, and `useSupplierSearch`.
 * - Assertions focus on observable state transitions and dependency calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { SupplierRow } from '@/api/suppliers/types';
import type { UseSupplierSearchReturn } from '@/pages/suppliers/hooks/useSupplierSearch';

const mocks = vi.hoisted(() => ({
  deleteSupplier: vi.fn(),
  useAuth: vi.fn(),
  useSupplierSearch: vi.fn(),
  resetSearch: vi.fn(),
}));

vi.mock('@/api/suppliers/supplierMutations', () => ({
  deleteSupplier: (...args: [string]) => mocks.deleteSupplier(...args),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mocks.useAuth(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

vi.mock('@/pages/suppliers/hooks/useSupplierSearch', () => ({
  useSupplierSearch: () => mocks.useSupplierSearch(),
}));

import { useDeleteSupplierForm } from '@/pages/suppliers/dialogs/DeleteSupplierDialog/useDeleteSupplierForm';
import { tEn } from '@/__tests__/test/i18nEn';

const supplier: SupplierRow = {
  id: 'sup-1',
  name: 'Supplier One',
  contactName: null,
  email: null,
  phone: null,
};

const defaultSearchState = (): UseSupplierSearchReturn => ({
  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  handleSearchQueryChange: vi.fn(),
  resetSearch: mocks.resetSearch,
});

describe('useDeleteSupplierForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useAuth.mockReturnValue({ user: { role: 'ADMIN' } });
    mocks.useSupplierSearch.mockReturnValue(defaultSearchState());
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useDeleteSupplierForm(vi.fn()));
    expect(result.current.selectedSupplier).toBeNull();
    expect(result.current.showConfirmation).toBe(false);
    expect(result.current.isDeleting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.searchQuery).toBe('');
  });

  it('enters confirmation and resets the search when a supplier is selected', () => {
    const { result } = renderHook(() => useDeleteSupplierForm(vi.fn()));

    act(() => {
      result.current.handleSelectSupplier(supplier);
    });

    expect(mocks.resetSearch).toHaveBeenCalledTimes(1);
    expect(result.current.selectedSupplier).toEqual(supplier);
    expect(result.current.showConfirmation).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('requires a selected supplier when delete is confirmed', async () => {
    const { result } = renderHook(() => useDeleteSupplierForm(vi.fn()));

    await act(async () => {
      await result.current.handleConfirmDelete();
    });

    expect(mocks.deleteSupplier).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Please select a supplier');
  });

  it('requires the ADMIN role when delete is confirmed', async () => {
    mocks.useAuth.mockReturnValue({ user: { role: 'USER' } });
    const { result } = renderHook(() => useDeleteSupplierForm(vi.fn()));

    act(() => {
      result.current.handleSelectSupplier(supplier);
    });

    await act(async () => {
      await result.current.handleConfirmDelete();
    });

    expect(mocks.deleteSupplier).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Only administrators can perform this action.');
  });

  it('calls deleteSupplier and notifies the parent when the deletion succeeds', async () => {
    const onDeleted = vi.fn();
    mocks.deleteSupplier.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDeleteSupplierForm(onDeleted));

    act(() => {
      result.current.handleSelectSupplier(supplier);
    });

    await act(async () => {
      await result.current.handleConfirmDelete();
    });

    expect(mocks.deleteSupplier).toHaveBeenCalledWith(supplier.id);
    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(result.current.isDeleting).toBe(false);
  });

  it('surfaces a user-facing error and resets loading when the API fails', async () => {
    const onDeleted = vi.fn();
    mocks.deleteSupplier.mockResolvedValue({
      success: false,
      error: 'cannot delete supplier with linked items',
    });

    const { result } = renderHook(() => useDeleteSupplierForm(onDeleted));

    act(() => {
      result.current.handleSelectSupplier(supplier);
    });

    await act(async () => {
      await result.current.handleConfirmDelete();
    });

    expect(onDeleted).not.toHaveBeenCalled();
    expect(result.current.error).toEqual(expect.any(String));
    expect(result.current.isDeleting).toBe(false);
  });

  it('surfaces an error and clears loading when the delete request throws', async () => {
    // A rejected promise (network drop, unexpected throw) is a different path from a
    // resolved { success: false } response: it lands in the catch arm.
    const onDeleted = vi.fn();
    const failure = new Error('network down');
    mocks.deleteSupplier.mockRejectedValue(failure);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useDeleteSupplierForm(onDeleted));

    act(() => {
      result.current.handleSelectSupplier(supplier);
    });

    await act(async () => {
      await result.current.handleConfirmDelete();
    });

    expect(onDeleted).not.toHaveBeenCalled();
    expect(result.current.error).toEqual(expect.any(String));
    expect(result.current.isDeleting).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith('Delete failed:', failure);
    errorSpy.mockRestore();
  });

  it('clears selection, error and confirmation and resets search when resetForm is called', () => {
    const { result } = renderHook(() => useDeleteSupplierForm(vi.fn()));

    act(() => {
      result.current.handleSelectSupplier(supplier);
    });
    expect(result.current.selectedSupplier).toEqual(supplier);

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.selectedSupplier).toBeNull();
    expect(result.current.showConfirmation).toBe(false);
    expect(result.current.error).toBeNull();
    // resetSearch is called once on select and once on reset.
    expect(mocks.resetSearch).toHaveBeenCalledTimes(2);
  });
});
