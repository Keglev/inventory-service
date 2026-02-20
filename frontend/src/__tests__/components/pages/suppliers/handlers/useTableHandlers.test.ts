/**
 * @file useTableHandlers.test.ts
 * @module __tests__/components/pages/suppliers/handlers/useTableHandlers
 * @description Contract tests for `useTableHandlers`.
 *
 * Contract under test:
 * - `handleRowClick({ id })` delegates to `setSelectedId(String(id))`.
 * - `handlePaginationChange(model)` delegates to `setPaginationModel(model)`.
 * - `handleSortChange(model)` delegates to `setSortModel(model)`.
 *
 * Out of scope:
 * - MUI DataGrid rendering/integration and event binding.
 * - Any derived logic (this hook is a pure delegator).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTableHandlers } from '../../../../../pages/suppliers/handlers/useTableHandlers';
import type { UseSuppliersBoardStateReturn } from '../../../../../pages/suppliers/hooks/useSuppliersBoardState';

describe('useTableHandlers', () => {
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
    renderHook(() => useTableHandlers(state)).result.current;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return handler functions', () => {
    const handlers = renderHandlers(createState());
    expect(handlers).toEqual(
      expect.objectContaining({
        handleRowClick: expect.any(Function),
        handlePaginationChange: expect.any(Function),
        handleSortChange: expect.any(Function),
      })
    );
  });

  it.each([
    {
      name: 'row click uses string id',
      run: (handlers: ReturnType<typeof renderHandlers>) => handlers.handleRowClick({ id: '123' }),
      assert: (state: UseSuppliersBoardStateReturn) => {
        expect(state.setSelectedId).toHaveBeenCalledWith('123');
      },
    },
    {
      name: 'row click normalizes numeric id',
      run: (handlers: ReturnType<typeof renderHandlers>) => handlers.handleRowClick({ id: 456 }),
      assert: (state: UseSuppliersBoardStateReturn) => {
        expect(state.setSelectedId).toHaveBeenCalledWith('456');
      },
    },
    {
      name: 'pagination change delegates model',
      run: (handlers: ReturnType<typeof renderHandlers>) =>
        handlers.handlePaginationChange({ page: 2, pageSize: 25 }),
      assert: (state: UseSuppliersBoardStateReturn) => {
        expect(state.setPaginationModel).toHaveBeenCalledWith({ page: 2, pageSize: 25 });
      },
    },
    {
      name: 'sort change delegates model',
      run: (handlers: ReturnType<typeof renderHandlers>) =>
        handlers.handleSortChange([{ field: 'name', sort: 'desc' }]),
      assert: (state: UseSuppliersBoardStateReturn) => {
        expect(state.setSortModel).toHaveBeenCalledWith([{ field: 'name', sort: 'desc' }]);
      },
    },
    {
      name: 'sort change supports empty model',
      run: (handlers: ReturnType<typeof renderHandlers>) => handlers.handleSortChange([]),
      assert: (state: UseSuppliersBoardStateReturn) => {
        expect(state.setSortModel).toHaveBeenCalledWith([]);
      },
    },
  ])('$name', ({ run, assert }) => {
    const state = createState();
    const handlers = renderHandlers(state);

    // Orchestration-only: handler delegates, state holds the behavior.
    run(handlers);
    assert(state);
  });
});
