/**
 * @file useRefreshHandler.test.ts
 * @module __tests__/components/pages/inventory/useRefreshHandler
 * @description Contract tests for `useRefreshHandler`:
 * - `handleReload` resets pagination to page 0 while preserving pageSize.
 *
 * Out of scope:
 * - Data fetching behavior (this hook only adjusts state).
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRefreshHandler } from '../../../../pages/inventory/handlers/useRefreshHandler';
import { makeInventoryState } from './fixtures';

describe('useRefreshHandler', () => {
  it('returns handleReload', () => {
    const mockState = makeInventoryState();
    const { result } = renderHook(() => useRefreshHandler(mockState));

    expect(result.current.handleReload).toBeTypeOf('function');
  });

  it('resets pagination to page 0 while preserving pageSize', () => {
    const mockState = makeInventoryState({ paginationModel: { page: 3, pageSize: 25 } });
    const { result } = renderHook(() => useRefreshHandler(mockState));

    result.current.handleReload();

    expect(mockState.setPaginationModel).toHaveBeenCalledWith({ page: 0, pageSize: 25 });
  });

  it('does not touch unrelated state', () => {
    const mockState = makeInventoryState({ paginationModel: { page: 3, pageSize: 25 } });
    const { result } = renderHook(() => useRefreshHandler(mockState));

    result.current.handleReload();

    expect(mockState.setQ).not.toHaveBeenCalled();
    expect(mockState.setSupplierId).not.toHaveBeenCalled();
    expect(mockState.setBelowMinOnly).not.toHaveBeenCalled();
    expect(mockState.setSortModel).not.toHaveBeenCalled();
    expect(mockState.setSelectedId).not.toHaveBeenCalled();
  });
});
