/**
 * @file useDataFetchingLogic.test.ts
 * @module __tests__/components/pages/inventory/useDataFetchingLogic
 * @description Adapter between InventoryBoard state and useInventoryPageData.
 *
 * Contract under test:
 * - Joins the first sort-model entry into a "field,direction" server string.
 * - Defaults direction to "asc" when the sort entry has no direction.
 * - Falls back to "name,asc" when the sort model is empty.
 * - Forwards filters and the 0-based pagination model unchanged.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../../../../pages/inventory/hooks/useInventoryPageData', () => ({
  useInventoryPageData: vi.fn(() => ({ items: [], loading: false })),
}));

import { useDataFetchingLogic } from '../../../../pages/inventory/handlers/useDataFetchingLogic';
import { useInventoryPageData } from '../../../../pages/inventory/hooks/useInventoryPageData';
import type { InventoryState, InventoryStateSetters } from '../../../../pages/inventory/hooks/useInventoryState';

const useInventoryPageDataMock = vi.mocked(useInventoryPageData);

function makeState(overrides: Partial<InventoryState> = {}) {
  return {
    supplierId: 'sup-1',
    q: 'widget',
    belowMinOnly: false,
    paginationModel: { page: 2, pageSize: 25 },
    sortModel: [{ field: 'quantity', sort: 'desc' }],
    ...overrides,
  } as InventoryState & InventoryStateSetters;
}

describe('useDataFetchingLogic', () => {
  beforeEach(() => {
    useInventoryPageDataMock.mockClear();
  });

  it('joins the sort model into a server sort string and forwards state', () => {
    renderHook(() => useDataFetchingLogic(makeState()));

    expect(useInventoryPageDataMock).toHaveBeenCalledWith(
      'sup-1',
      'widget',
      false,
      2,
      25,
      'quantity,desc'
    );
  });

  it('defaults the direction to asc when the sort entry has none', () => {
    renderHook(() =>
      useDataFetchingLogic(makeState({ sortModel: [{ field: 'name', sort: null }] }))
    );

    expect(useInventoryPageDataMock).toHaveBeenCalledWith(
      'sup-1',
      'widget',
      false,
      2,
      25,
      'name,asc'
    );
  });

  it('falls back to name,asc when the sort model is empty', () => {
    renderHook(() => useDataFetchingLogic(makeState({ sortModel: [] })));

    expect(useInventoryPageDataMock).toHaveBeenCalledWith(
      'sup-1',
      'widget',
      false,
      2,
      25,
      'name,asc'
    );
  });

  it('returns the data object from useInventoryPageData unchanged', () => {
    const { result } = renderHook(() => useDataFetchingLogic(makeState()));

    expect(result.current).toEqual({ items: [], loading: false });
  });
});
