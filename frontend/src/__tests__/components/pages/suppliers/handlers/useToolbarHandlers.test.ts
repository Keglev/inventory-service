/**
 * @file useToolbarHandlers.test.ts
 * @module __tests__/components/pages/suppliers/handlers/useToolbarHandlers
 * @description Contract tests for `useToolbarHandlers`.
 *
 * Contract under test:
 * - Exposes three toolbar handlers: create, edit, delete.
 * - Each handler is a pure orchestration function that delegates to a single state setter.
 *   - Add New → `setOpenCreate(true)`
 *   - Edit → `setOpenEdit(true)`
 *   - Delete → `setOpenDelete(true)`
 * - Handlers must not trigger unrelated setters.
 *
 * Out of scope:
 * - Button rendering and UI event binding (component-level tests).
 * - State shape semantics beyond the setters this hook touches.
 *
 * Test strategy:
 * - Provide a fully typed `UseSuppliersBoardStateReturn` with spy setters.
 * - Assert on observable orchestration only (calls + arguments).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useToolbarHandlers } from '../../../../../pages/suppliers/handlers/useToolbarHandlers';
import type { UseSuppliersBoardStateReturn } from '../../../../../pages/suppliers/hooks/useSuppliersBoardState';

describe('useToolbarHandlers', () => {
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
    renderHook(() => useToolbarHandlers(state)).result.current;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return handler functions', () => {
    const handlers = renderHandlers(createState());

    // Keep this assertion shallow: the behavioral contract is covered below.
    expect(handlers).toEqual(
      expect.objectContaining({
        handleAddNew: expect.any(Function),
        handleEdit: expect.any(Function),
        handleDelete: expect.any(Function),
      })
    );
  });

  it.each([
    {
      name: 'Add New opens create dialog only',
      invoke: (h: ReturnType<typeof renderHandlers>) => h.handleAddNew(),
      expectedSetter: 'setOpenCreate' as const,
    },
    {
      name: 'Edit opens edit dialog only',
      invoke: (h: ReturnType<typeof renderHandlers>) => h.handleEdit(),
      expectedSetter: 'setOpenEdit' as const,
    },
    {
      name: 'Delete opens delete dialog only',
      invoke: (h: ReturnType<typeof renderHandlers>) => h.handleDelete(),
      expectedSetter: 'setOpenDelete' as const,
    },
  ])('$name', ({ invoke, expectedSetter }) => {
    const state = createState({ selectedId: 'supplier-123' });
    const handlers = renderHandlers(state);

    // Each handler should only flip its corresponding dialog flag.
    invoke(handlers);
    expect(state[expectedSetter]).toHaveBeenCalledWith(true);

    const otherSetters = (['setOpenCreate', 'setOpenEdit', 'setOpenDelete'] as const).filter(
      (s) => s !== expectedSetter
    );
    for (const setterName of otherSetters) {
      expect(state[setterName]).not.toHaveBeenCalled();
    }
  });

  it('supports multiple calls without hidden side effects', () => {
    const state = createState();
    const handlers = renderHandlers(state);

    // Intentional repetition: ensures handler callbacks are stable and only delegate.
    handlers.handleAddNew();
    handlers.handleAddNew();
    handlers.handleEdit();
    handlers.handleDelete();

    expect(state.setOpenCreate).toHaveBeenCalledTimes(2);
    expect(state.setOpenEdit).toHaveBeenCalledTimes(1);
    expect(state.setOpenDelete).toHaveBeenCalledTimes(1);
  });
});
