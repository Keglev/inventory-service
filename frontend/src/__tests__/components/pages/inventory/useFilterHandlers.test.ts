/**
 * @file useFilterHandlers.test.ts
 * @module __tests__/components/pages/inventory/useFilterHandlers
 * @description Contract tests for `useFilterHandlers`:
 * - Delegates UI events into InventoryState setters.
 * - Resets related state when supplier changes.
 *
 * Out of scope:
 * - React rendering details (hook is tested via renderHook only).
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilterHandlers } from '../../../../pages/inventory/handlers/useFilterHandlers';
import { makeInventoryState } from './fixtures';

describe('useFilterHandlers', () => {
  it('returns the expected handlers', () => {
    const mockState = makeInventoryState();
    const { result } = renderHook(() => useFilterHandlers(mockState));

    expect(result.current.handleSearchChange).toBeTypeOf('function');
    expect(result.current.handleSupplierChange).toBeTypeOf('function');
    expect(result.current.handleBelowMinChange).toBeTypeOf('function');
  });

  it('updates q when searching', () => {
    const mockState = makeInventoryState();
    const { result } = renderHook(() => useFilterHandlers(mockState));

    result.current.handleSearchChange('test query');

    expect(mockState.setQ).toHaveBeenCalledWith('test query');
  });

  it('updates supplier and resets related state', () => {
    const mockState = makeInventoryState({
      paginationModel: { page: 2, pageSize: 25 },
      selectedId: '123',
      q: 'existing',
    });
    const { result } = renderHook(() => useFilterHandlers(mockState));

    result.current.handleSupplierChange('456');

    expect(mockState.setSupplierId).toHaveBeenCalledWith('456');
    expect(mockState.setSelectedId).toHaveBeenCalledWith(null);
    expect(mockState.setQ).toHaveBeenCalledWith('');
    expect(mockState.setPaginationModel).toHaveBeenCalledWith({ page: 0, pageSize: 25 });
  });

  it('preserves pageSize when resetting pagination', () => {
    const mockState = makeInventoryState({ paginationModel: { page: 5, pageSize: 50 } });
    const { result } = renderHook(() => useFilterHandlers(mockState));

    result.current.handleSupplierChange('123');

    expect(mockState.setPaginationModel).toHaveBeenCalledWith({ page: 0, pageSize: 50 });
  });

  it('toggles belowMinOnly and resets pagination', () => {
    const mockState = makeInventoryState({ paginationModel: { page: 3, pageSize: 20 } });
    const { result } = renderHook(() => useFilterHandlers(mockState));

    result.current.handleBelowMinChange(true);

    expect(mockState.setBelowMinOnly).toHaveBeenCalledWith(true);
    expect(mockState.setPaginationModel).toHaveBeenCalledWith({ page: 0, pageSize: 20 });
  });
});
