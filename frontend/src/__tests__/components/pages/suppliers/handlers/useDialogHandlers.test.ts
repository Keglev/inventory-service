/**
 * @file useDialogHandlers.test.ts
 * @module __tests__/components/pages/suppliers/handlers/useDialogHandlers
 * @description Contract tests for `useDialogHandlers`.
 *
 * Contract under test:
 * - Exposes CRUD dialog callbacks: created/updated/deleted.
 * - Each callback orchestrates three responsibilities:
 *   1) User feedback via toast (translated message + `success`).
 *   2) React Query cache invalidation for the suppliers list.
 *   3) Local UI state updates (close dialog; clear selection where applicable).
 *
 * Out of scope:
 * - React Query internals and network activity.
 * - i18n translation correctness (we return fallback strings deterministically).
 *
 * Test strategy:
 * - Deterministic hoisted spies for toast + query invalidation.
 * - Table-driven scenarios to keep coverage while reducing repetition.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDialogHandlers } from '../../../../../pages/suppliers/handlers/useDialogHandlers';
import type { UseSuppliersBoardStateReturn } from '../../../../../pages/suppliers/hooks/useSuppliersBoardState';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  invalidateQueries: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  // Prefer fallback/defaultValue so assertions remain stable across locales.
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

vi.mock('../../../../../context/toast', () => ({
  useToast: () => mocks.toast,
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

describe('useDialogHandlers', () => {
  const createState = (overrides: Partial<UseSuppliersBoardStateReturn> = {}): UseSuppliersBoardStateReturn => ({
    paginationModel: { page: 0, pageSize: 10 },
    sortModel: [],
    searchQuery: '',
    showAllSuppliers: false,
    selectedId: null,
    selectedSearchResult: null,
    openCreate: false,
    openEdit: false,
    openDelete: false,
    setOpenCreate: vi.fn(),
    setOpenEdit: vi.fn(),
    setOpenDelete: vi.fn(),
    setSearchQuery: vi.fn(),
    setSelectedSearchResult: vi.fn(),
    setSelectedId: vi.fn(),
    setPaginationModel: vi.fn(),
    setSortModel: vi.fn(),
    setShowAllSuppliers: vi.fn(),
    ...overrides,
  });

  const renderHandlers = (state: UseSuppliersBoardStateReturn) =>
    renderHook(() => useDialogHandlers(state)).result.current;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return handler functions', () => {
    const handlers = renderHandlers(createState());

    // Keep this assertion shallow: behavioral contracts are covered below.
    expect(handlers).toEqual(
      expect.objectContaining({
        handleSupplierCreated: expect.any(Function),
        handleSupplierUpdated: expect.any(Function),
        handleSupplierDeleted: expect.any(Function),
      })
    );
  });

  it.each([
    {
      name: 'created: toasts, invalidates cache, closes create dialog',
      invoke: (h: ReturnType<typeof renderHandlers>) => h.handleSupplierCreated(),
      expectedToast: 'Supplier created successfully',
      expectedOpenSetter: 'setOpenCreate' as const,
      clearsSelection: false,
    },
    {
      name: 'updated: toasts, invalidates cache, closes edit dialog, clears selection',
      invoke: (h: ReturnType<typeof renderHandlers>) => h.handleSupplierUpdated(),
      expectedToast: 'Supplier updated successfully',
      expectedOpenSetter: 'setOpenEdit' as const,
      clearsSelection: true,
    },
    {
      name: 'deleted: toasts, invalidates cache, closes delete dialog, clears selection',
      invoke: (h: ReturnType<typeof renderHandlers>) => h.handleSupplierDeleted(),
      expectedToast: 'Supplier deleted successfully',
      expectedOpenSetter: 'setOpenDelete' as const,
      clearsSelection: true,
    },
  ])('$name', ({ invoke, expectedToast, expectedOpenSetter, clearsSelection }) => {
    const state = createState({ selectedId: 'supplier-123' });
    const handlers = renderHandlers(state);

    // Execute the callback under test.
    invoke(handlers);

    // User feedback and cache freshness are always part of the contract.
    expect(mocks.toast).toHaveBeenCalledWith(expectedToast, 'success');
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['suppliers'] });

    // UI state updates are operation-specific.
    expect(state[expectedOpenSetter]).toHaveBeenCalledWith(false);
    if (clearsSelection) {
      expect(state.setSelectedId).toHaveBeenCalledWith(null);
    } else {
      expect(state.setSelectedId).not.toHaveBeenCalled();
    }
  });
});
