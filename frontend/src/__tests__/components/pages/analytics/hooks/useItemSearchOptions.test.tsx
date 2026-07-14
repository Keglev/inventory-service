/**
 * @file useItemSearchOptions.test.tsx
 * @module __tests__/components/pages/analytics/hooks/useItemSearchOptions
 * @description Shared item typeahead state hook (query text, debounce,
 * selection, supplier-scoped vs global search).
 *
 * Contract under test:
 * - Empty debounced query short-circuits to [] without an API call.
 * - Supplier present -> searchItemsForSupplier; absent -> searchItemsGlobal.
 * - keepPrevious opts into TanStack placeholderData.
 * - Changing the supplier resets both the query text and the selection.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('../../../../../api/shared/itemSearch', () => ({
  searchItemsForSupplier: vi.fn(),
  searchItemsGlobal: vi.fn(),
}));

// Pass-through debounce keeps the tests synchronous; the debounce timing
// itself is covered by the useDebounced unit test.
vi.mock('../../../../../hooks/useDebounced', () => ({
  useDebounced: (value: string) => value,
}));

import { useItemSearchOptions } from '../../../../../pages/analytics/hooks/useItemSearchOptions';
import {
  searchItemsForSupplier,
  searchItemsGlobal,
} from '../../../../../api/shared/itemSearch';

const searchForSupplierMock = vi.mocked(searchItemsForSupplier);
const searchGlobalMock = vi.mocked(searchItemsGlobal);

const items = [{ id: 'it-1', name: 'Blue Widget' }];

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function renderOptions(params: Partial<Parameters<typeof useItemSearchOptions>[0]> = {}) {
  return renderHook(
    (p: Parameters<typeof useItemSearchOptions>[0]) => useItemSearchOptions(p),
    {
      wrapper,
      initialProps: {
        supplierId: undefined,
        minChars: 0,
        queryKeyScope: 'test-scope',
        ...params,
      } as Parameters<typeof useItemSearchOptions>[0],
    }
  );
}

describe('useItemSearchOptions', () => {
  beforeEach(() => {
    searchForSupplierMock.mockReset();
    searchGlobalMock.mockReset();
    searchForSupplierMock.mockResolvedValue(items as never);
    searchGlobalMock.mockResolvedValue(items as never);
  });

  it('short-circuits an empty query to [] without touching the API', async () => {
    const { result } = renderOptions({ minChars: 0 });

    await waitFor(() => expect(result.current.searchQuery.isSuccess).toBe(true));

    expect(result.current.searchQuery.data).toEqual([]);
    expect(searchForSupplierMock).not.toHaveBeenCalled();
    expect(searchGlobalMock).not.toHaveBeenCalled();
  });

  it('searches within the supplier scope when one is set', async () => {
    const { result } = renderOptions({ supplierId: 'sup-1', minChars: 2 });

    act(() => {
      result.current.setItemQuery('blue');
    });

    await waitFor(() =>
      expect(searchForSupplierMock).toHaveBeenCalledWith('sup-1', 'blue', 50)
    );
    expect(searchGlobalMock).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.searchQuery.data).toEqual(items));
  });

  it('falls back to the global search without a supplier', async () => {
    const { result } = renderOptions({ minChars: 2 });

    act(() => {
      result.current.setItemQuery('blue');
    });

    await waitFor(() => expect(searchGlobalMock).toHaveBeenCalledWith('blue', 50));
    expect(searchForSupplierMock).not.toHaveBeenCalled();
  });

  it('accepts the keepPrevious option (placeholderData path)', async () => {
    const { result } = renderOptions({ minChars: 2, keepPrevious: true });

    act(() => {
      result.current.setItemQuery('blue');
    });

    await waitFor(() => expect(result.current.searchQuery.data).toEqual(items));
  });

  it('resets the query text and selection when the supplier changes', async () => {
    const { result, rerender } = renderOptions({ supplierId: 'sup-1', minChars: 2 });

    act(() => {
      result.current.setItemQuery('blue');
      result.current.setSelectedItem(items[0]);
    });
    await waitFor(() => expect(result.current.selectedItem).toEqual(items[0]));

    rerender({
      supplierId: 'sup-2',
      minChars: 2,
      queryKeyScope: 'test-scope',
    } as Parameters<typeof useItemSearchOptions>[0]);

    await waitFor(() => {
      expect(result.current.itemQuery).toBe('');
      expect(result.current.selectedItem).toBeNull();
    });
  });
});
