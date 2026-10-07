/**
 * @file supplierListSharing.test.tsx
 * @module tests/unit/api/suppliers/hooks/supplierListSharing
 * @description Cache-sharing tests for useSupplierListQuery and
 * useSuppliersQuery with a real QueryClient.
 *
 * Contract under test:
 * - The suppliers board (rows) and the inventory dialogs (options) read one
 *   cache entry: mounted together they cause one GET /api/suppliers.
 * - A supplier write invalidates ['suppliers'], which refreshes both views.
 *
 * Out of scope:
 * - The fetcher's HTTP wiring and parsing (supplierListFetcher.test.ts).
 */

import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api/suppliers/supplierListFetcher', () => ({
  getAllSuppliers: vi.fn(),
}));

import { getAllSuppliers } from '@/api/suppliers/supplierListFetcher';
import { useSupplierListQuery } from '@/api/suppliers/hooks/useSupplierListQuery';
import { useSuppliersQuery } from '@/api/inventory/hooks/useSuppliersQuery';

const getAllSuppliersMock = getAllSuppliers as ReturnType<typeof vi.fn>;

function renderBoth() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const view = renderHook(
    () => ({ rows: useSupplierListQuery(), options: useSuppliersQuery(true) }),
    { wrapper },
  );
  return { client, view };
}

describe('supplier list cache sharing', () => {
  it('serves the board rows and the dialog options from one request', async () => {
    getAllSuppliersMock.mockResolvedValue([{ id: 'SUP-1', name: 'Acme' }]);

    const { view } = renderBoth();

    await waitFor(() => expect(view.result.current.options.data).toEqual([{ id: 'SUP-1', label: 'Acme' }]));
    expect(view.result.current.rows.data).toEqual([{ id: 'SUP-1', name: 'Acme' }]);
    expect(getAllSuppliersMock).toHaveBeenCalledTimes(1);
  });

  it('refreshes both views when supplier queries are invalidated', async () => {
    getAllSuppliersMock.mockResolvedValueOnce([{ id: 'SUP-1', name: 'Acme' }]);
    const { client, view } = renderBoth();
    await waitFor(() => expect(view.result.current.rows.data).toHaveLength(1));

    getAllSuppliersMock.mockResolvedValueOnce([{ id: 'SUP-1', name: 'Acme Renamed' }]);
    await client.invalidateQueries({ queryKey: ['suppliers'] });

    await waitFor(() => expect(view.result.current.options.data).toEqual([{ id: 'SUP-1', label: 'Acme Renamed' }]));
    expect(view.result.current.rows.data).toEqual([{ id: 'SUP-1', name: 'Acme Renamed' }]);
    expect(getAllSuppliersMock).toHaveBeenCalledTimes(2);
  });
});
