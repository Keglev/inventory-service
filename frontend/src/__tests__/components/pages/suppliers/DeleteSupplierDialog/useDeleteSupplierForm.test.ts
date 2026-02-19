/**
 * @file useDeleteSupplierForm.test.ts
 * @module __tests__/components/pages/suppliers/DeleteSupplierDialog/useDeleteSupplierForm
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
 * - On failed/blocked deletes, surfaces a user-facing error message and resets loading state.
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
import type { SupplierRow } from '../../../../../api/suppliers/types';
import type { UseSupplierSearchReturn } from '../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/useSupplierSearch';

const mocks = vi.hoisted(() => ({
  deleteSupplier: vi.fn(),
  useAuth: vi.fn(),
  useSupplierSearch: vi.fn(),
  resetSearch: vi.fn(),
}));

vi.mock('../../../../../api/suppliers', () => ({
  deleteSupplier: (...args: [string]) => mocks.deleteSupplier(...args),
}));

vi.mock('../../../../../hooks/useAuth', () => ({
  useAuth: () => mocks.useAuth(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

vi.mock('../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/useSupplierSearch', () => ({
  useSupplierSearch: () => mocks.useSupplierSearch(),
}));

import { useDeleteSupplierForm } from '../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/useDeleteSupplierForm';

const supplier: SupplierRow = {
  id: 'sup-1',
  name: 'Supplier One',
  contactName: null,
  email: null,
  phone: null,
};

const defaultSearchState = (): UseSupplierSearchReturn => ({
  searchQuery: '',
  setSearchQuery: vi.fn(),
  searchResults: [],
  searchLoading: false,
  handleSearchQueryChange: vi.fn(async () => undefined),
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

  it('selecting a supplier enters confirmation and resets search', () => {
    const { result } = renderHook(() => useDeleteSupplierForm(vi.fn()));

    act(() => {
      result.current.handleSelectSupplier(supplier);
    });

    expect(mocks.resetSearch).toHaveBeenCalledTimes(1);
    expect(result.current.selectedSupplier).toEqual(supplier);
    expect(result.current.showConfirmation).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('confirm delete requires a selected supplier', async () => {
    const { result } = renderHook(() => useDeleteSupplierForm(vi.fn()));

    await act(async () => {
      await result.current.handleConfirmDelete();
    });

    expect(mocks.deleteSupplier).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Please select a supplier');
  });

  it('confirm delete requires ADMIN role', async () => {
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

  it('on success, calls deleteSupplier and notifies parent', async () => {
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

  it('on API failure, surfaces a user-facing error and resets loading', async () => {
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
});
