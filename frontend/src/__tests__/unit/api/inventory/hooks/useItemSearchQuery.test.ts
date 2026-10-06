/**
 * @file useItemSearchQuery.test.ts
 * @module tests/unit/api/inventory/hooks/useItemSearchQuery
 * @description Contract tests for useItemSearchQuery (item pickers of the
 * inventory dialogs, frontend ADR-0014).
 *
 * Contract under test:
 * - Nothing loads until a supplier is chosen.
 * - The supplier's list loads once; typing is matched in the browser by
 *   name or SKU and sends no request.
 * - Choosing another supplier drops the previous supplier's list at once.
 * - An incomplete list falls back to the server search from two characters.
 *
 * Out of scope:
 * - The fetchers themselves (itemSearch.search.test).
 */

import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api/shared/itemSearch', () => ({
  listItemsForSupplier: vi.fn(),
  searchItemsForSupplier: vi.fn(),
}));

import { listItemsForSupplier, searchItemsForSupplier } from '@/api/shared/itemSearch';
import { useItemSearchQuery } from '@/api/inventory/hooks/useItemSearchQuery';
import type { SupplierOption } from '@/api/analytics/types';

const listMock = vi.mocked(listItemsForSupplier);
const searchMock = vi.mocked(searchItemsForSupplier);

const iberia: SupplierOption = { id: 'S-4', label: 'Iberia' };
const nordbay: SupplierOption = { id: 'S-1', label: 'Nordbay' };
const pallet = { id: 'I-1', name: 'EUR-1 Wooden Pallet', sku: 'LOG-PAL-EUR1' };
const band = { id: 'I-2', name: 'PET Strapping Band', sku: 'LOG-STRAP-16' };

function setup(initial: { supplier: SupplierOption | null; query: string }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client, children });
  const view = renderHook(({ supplier, query }) => useItemSearchQuery(supplier, query), {
    initialProps: initial,
    wrapper,
  });
  return { ...view, client };
}

describe('useItemSearchQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listMock.mockResolvedValue({ items: [pallet, band], complete: true });
    searchMock.mockResolvedValue([]);
  });

  it('loads nothing until a supplier is chosen', () => {
    const { result } = setup({ supplier: null, query: 'pal' });

    expect(result.current).toEqual({ data: [], isLoading: false });
    expect(listMock).not.toHaveBeenCalled();
  });

  it('loads the supplier list once and matches name or SKU while typing', async () => {
    const { result, rerender } = setup({ supplier: iberia, query: '' });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);

    rerender({ supplier: iberia, query: 'wood' });
    expect(result.current.data).toEqual([pallet]);

    rerender({ supplier: iberia, query: 'log-' });
    expect(result.current.data).toEqual([pallet, band]);

    rerender({ supplier: iberia, query: 'l' });
    expect(result.current.data).toEqual([]);

    expect(listMock).toHaveBeenCalledTimes(1);
    expect(listMock).toHaveBeenCalledWith('S-4');
    expect(searchMock).not.toHaveBeenCalled();
  });

  it('drops the previous supplier list when another supplier is chosen', async () => {
    const { result, rerender, client } = setup({ supplier: iberia, query: '' });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(client.getQueryData(['inventory', 'supplierItems', 'S-4'])).toBeDefined();

    rerender({ supplier: nordbay, query: '' });

    await waitFor(() => expect(client.getQueryData(['inventory', 'supplierItems', 'S-4'])).toBeUndefined());
    expect(listMock).toHaveBeenLastCalledWith('S-1');
  });

  it('falls back to the server search when the list is incomplete', async () => {
    listMock.mockResolvedValue({ items: [], complete: false });
    searchMock.mockResolvedValue([band]);
    const { result, rerender } = setup({ supplier: iberia, query: 'b' });
    await waitFor(() => expect(listMock).toHaveBeenCalled());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(searchMock).not.toHaveBeenCalled();

    rerender({ supplier: iberia, query: 'band' });

    await waitFor(() => expect(result.current.data).toEqual([band]));
    expect(searchMock).toHaveBeenCalledWith('S-4', 'band', 50);
  });
});
