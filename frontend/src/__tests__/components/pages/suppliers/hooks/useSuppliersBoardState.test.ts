/**
 * @file useSuppliersBoardState.test.ts
 * @module __tests__/components/pages/suppliers/hooks/useSuppliersBoardState
 * @description Contract tests for the `useSuppliersBoardState` orchestration hook.
 *
 * Contract under test:
 * - Exposes stable default state for the suppliers board.
 * - Updates state via the public setter functions (search, pagination, sorting, selection, dialogs).
 *
 * Out of scope:
 * - React state implementation details (we treat React as a trusted dependency).
 *
 * Test strategy:
 * - Assert defaults and observable state transitions after calling setters.
 * - Use table-driven cases to keep coverage clear and non-duplicative.
 */

import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useSuppliersBoardState,
  type UseSuppliersBoardStateReturn,
} from '../../../../../pages/suppliers/hooks/useSuppliersBoardState';
import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid';

// Rendering helper: keeps the tests focused on state transitions, not hook setup ceremony.
const renderState = () => renderHook(() => useSuppliersBoardState());

describe('useSuppliersBoardState', () => {
  it('initializes with default values', () => {
    const { result } = renderState();

    expect(result.current).toMatchObject({
      searchQuery: '',
      showAllSuppliers: false,
      paginationModel: { page: 0, pageSize: 6 },
      sortModel: [{ field: 'name', sort: 'asc' }],
      selectedId: null,
      selectedSearchResult: null,
      openCreate: false,
      openEdit: false,
      openDelete: false,
    });
  });

  it.each([
    {
      name: 'search query',
      perform: (state: UseSuppliersBoardStateReturn) => state.setSearchQuery('acme corp'),
      assert: (state: UseSuppliersBoardStateReturn) =>
        expect(state.searchQuery).toBe('acme corp'),
    },
    {
      name: 'showAllSuppliers flag',
      perform: (state: UseSuppliersBoardStateReturn) => state.setShowAllSuppliers(true),
      assert: (state: UseSuppliersBoardStateReturn) =>
        expect(state.showAllSuppliers).toBe(true),
    },
    {
      name: 'pagination model',
      perform: (state: UseSuppliersBoardStateReturn) => {
        const next: GridPaginationModel = { page: 2, pageSize: 15 };
        state.setPaginationModel(next);
      },
      assert: (state: UseSuppliersBoardStateReturn) =>
        expect(state.paginationModel).toEqual({ page: 2, pageSize: 15 }),
    },
    {
      name: 'sort model',
      perform: (state: UseSuppliersBoardStateReturn) => {
        const next: GridSortModel = [{ field: 'lastContact', sort: 'desc' }];
        state.setSortModel(next);
      },
      assert: (state: UseSuppliersBoardStateReturn) =>
        expect(state.sortModel).toEqual([{ field: 'lastContact', sort: 'desc' }]),
    },
    {
      name: 'selected id',
      perform: (state: UseSuppliersBoardStateReturn) => state.setSelectedId('supplier-123'),
      assert: (state: UseSuppliersBoardStateReturn) =>
        expect(state.selectedId).toBe('supplier-123'),
    },
  ])('updates $name', ({ perform, assert }) => {
    const { result } = renderState();

    act(() => {
      perform(result.current);
    });

    assert(result.current);
  });

  it('allows clearing the selected id', () => {
    const { result } = renderState();

    act(() => {
      result.current.setSelectedId('supplier-123');
      result.current.setSelectedId(null);
    });

    expect(result.current.selectedId).toBeNull();
  });

  it.each([
    {
      name: 'create dialog',
      open: (state: UseSuppliersBoardStateReturn) => state.setOpenCreate(true),
      close: (state: UseSuppliersBoardStateReturn) => state.setOpenCreate(false),
      isOpen: (state: UseSuppliersBoardStateReturn) => state.openCreate,
    },
    {
      name: 'edit dialog',
      open: (state: UseSuppliersBoardStateReturn) => state.setOpenEdit(true),
      close: (state: UseSuppliersBoardStateReturn) => state.setOpenEdit(false),
      isOpen: (state: UseSuppliersBoardStateReturn) => state.openEdit,
    },
    {
      name: 'delete dialog',
      open: (state: UseSuppliersBoardStateReturn) => state.setOpenDelete(true),
      close: (state: UseSuppliersBoardStateReturn) => state.setOpenDelete(false),
      isOpen: (state: UseSuppliersBoardStateReturn) => state.openDelete,
    },
  ])('toggles $name', ({ open, close, isOpen }) => {
    const { result } = renderState();

    act(() => {
      open(result.current);
    });
    expect(isOpen(result.current)).toBe(true);

    act(() => {
      close(result.current);
    });
    expect(isOpen(result.current)).toBe(false);
  });

  it('updates multiple state properties independently', () => {
    const { result } = renderState();
    const newPaginationModel: GridPaginationModel = { page: 1, pageSize: 20 };
    const newSortModel: GridSortModel = [{ field: 'name', sort: 'desc' }];

    act(() => {
      result.current.setSearchQuery('test query');
      result.current.setPaginationModel(newPaginationModel);
      result.current.setSortModel(newSortModel);
      result.current.setOpenCreate(true);
    });

    expect(result.current).toMatchObject({
      searchQuery: 'test query',
      paginationModel: newPaginationModel,
      sortModel: newSortModel,
      openCreate: true,
      showAllSuppliers: false,
    });
  });
});
