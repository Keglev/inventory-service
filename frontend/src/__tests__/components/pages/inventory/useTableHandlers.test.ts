/**
 * @file useTableHandlers.test.ts
 * @module __tests__/components/pages/inventory/useTableHandlers
 * @description Contract tests for `useTableHandlers`:
 * - Maps table events (row click/pagination/sort) to InventoryState setters.
 *
 * Out of scope:
 * - DataGrid internals (we validate our event→setter mapping only).
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTableHandlers } from '../../../../pages/inventory/handlers/useTableHandlers';
import { makeInventoryState } from './fixtures';

describe('useTableHandlers', () => {
  it('returns the expected handlers', () => {
    const mockState = makeInventoryState();
    const { result } = renderHook(() => useTableHandlers(mockState));

    expect(result.current.handleRowClick).toBeTypeOf('function');
    expect(result.current.handlePaginationChange).toBeTypeOf('function');
    expect(result.current.handleSortChange).toBeTypeOf('function');
  });

  it('sets selectedId on row click', () => {
    const mockState = makeInventoryState();
    const { result } = renderHook(() => useTableHandlers(mockState));

    result.current.handleRowClick('item-123');

    expect(mockState.setSelectedId).toHaveBeenCalledWith('item-123');
  });

  it('sets pagination model', () => {
    const mockState = makeInventoryState();
    const { result } = renderHook(() => useTableHandlers(mockState));

    const newModel = { page: 2, pageSize: 25 };
    result.current.handlePaginationChange(newModel);

    expect(mockState.setPaginationModel).toHaveBeenCalledWith(newModel);
  });

  it('sets sort model', () => {
    const mockState = makeInventoryState();
    const { result } = renderHook(() => useTableHandlers(mockState));

    const newSortModel = [{ field: 'name', sort: 'asc' as const }];
    result.current.handleSortChange(newSortModel);

    expect(mockState.setSortModel).toHaveBeenCalledWith(newSortModel);
  });
});
