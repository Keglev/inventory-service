/**
 * @file useFilterHandlers.test.ts
 * @module __tests__/components/pages/suppliers/handlers/useFilterHandlers
 * @description Contract tests for `useFilterHandlers`.
 *
 * Contract under test:
 * - Exposes `handleToggleShowAll(show)`.
 * - Delegates directly to `state.setShowAllSuppliers(show)`.
 *
 * Out of scope:
 * - Filter UI rendering/event binding.
 * - Any derived filtering logic (this hook is a thin orchestrator).
 *
 * Test strategy:
 * - Provide a fully-typed `UseSuppliersBoardStateReturn` with a spy setter.
 * - Assert only on delegation and arguments (no duplication of production logic).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilterHandlers } from '../../../../../pages/suppliers/handlers/useFilterHandlers';
import type { UseSuppliersBoardStateReturn } from '../../../../../pages/suppliers/hooks/useSuppliersBoardState';

describe('useFilterHandlers', () => {
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
    renderHook(() => useFilterHandlers(state)).result.current;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return handler functions', () => {
    const handlers = renderHandlers(createState());
    expect(handlers).toEqual(expect.objectContaining({ handleToggleShowAll: expect.any(Function) }));
  });

  it.each([
    { show: true },
    { show: false },
  ])('delegates showAllSuppliers toggle: $show', ({ show }) => {
    const state = createState();
    const handlers = renderHandlers(state);

    // Orchestration-only: this hook should be a thin delegator.
    handlers.handleToggleShowAll(show);
    expect(state.setShowAllSuppliers).toHaveBeenCalledWith(show);
  });
});
