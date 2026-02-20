/**
 * @file SuppliersBoard.test.tsx
 * @module __tests__/components/pages/suppliers/SuppliersBoard
 * @description Contract tests for the `SuppliersBoard` orchestrator.
 *
 * Contract under test:
 * - Orchestrates state + handlers + data into presentation components.
 * - Applies board-only display rules:
 *   - Table is hidden when `showAllSuppliers=false` and no search selection.
 *   - When a supplier is selected from search, the table shows exactly that one row.
 * - Computes toolbar enablement from auth + selection (board responsibility).
 *
 * Out of scope:
 * - Child component rendering/behavior (covered by their own test suites in this folder).
 * - Handler hook internals (covered by handler hook tests).
 *
 * Test strategy:
 * - Replace each child component with a spy-only test double and assert on the props it receives.
 * - Keep cases minimal to avoid duplicating coverage from the component suites.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import SuppliersBoard from '../../../../pages/suppliers/SuppliersBoard';
import type { SupplierRow } from '../../../../api/suppliers';
import type { UseSuppliersBoardStateReturn } from '../../../../pages/suppliers/hooks/useSuppliersBoardState';

type SuppliersBoardData = {
  suppliers: SupplierRow[];
  total: number;
  searchResults: SupplierRow[];
  isLoadingSuppliers: boolean;
  isLoadingSearch: boolean;
  error?: string | null;
};

const spies = vi.hoisted(() => ({
  // Component spies: we capture props only (no UI assertions here).
  SuppliersToolbar: vi.fn<[unknown], void>(),
  SuppliersSearchPanel: vi.fn<[unknown], void>(),
  SuppliersFilterPanel: vi.fn<[unknown], void>(),
  SuppliersTable: vi.fn<[unknown], void>(),
  SuppliersDialogs: vi.fn<[unknown], void>(),
}));

const runtime = vi.hoisted(() => ({
  user: { role: 'USER', isDemo: false } as { role: string; isDemo?: boolean } | null,
  state: null as unknown as UseSuppliersBoardStateReturn,
  data: null as unknown as SuppliersBoardData,
  handlers: {
    handleAddNew: vi.fn(),
    handleEdit: vi.fn(),
    handleDelete: vi.fn(),
    handleSearchChange: vi.fn(),
    handleSearchResultSelect: vi.fn(),
    handleClearSearchSelection: vi.fn(),
    handleRowClick: vi.fn(),
    handlePaginationChange: vi.fn(),
    handleSortChange: vi.fn(),
    handleToggleShowAll: vi.fn(),
    handleSupplierCreated: vi.fn(),
    handleSupplierUpdated: vi.fn(),
    handleSupplierDeleted: vi.fn(),
  },
}));

vi.mock('../../../../pages/suppliers/components', () => ({
  SuppliersToolbar: (props: unknown) => {
    spies.SuppliersToolbar(props);
    return null;
  },
  SuppliersSearchPanel: (props: unknown) => {
    spies.SuppliersSearchPanel(props);
    return null;
  },
  SuppliersFilterPanel: (props: unknown) => {
    spies.SuppliersFilterPanel(props);
    return null;
  },
  SuppliersTable: (props: unknown) => {
    spies.SuppliersTable(props);
    return null;
  },
  SuppliersDialogs: (props: unknown) => {
    spies.SuppliersDialogs(props);
    return null;
  },
}));

vi.mock('../../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: runtime.user }),
}));

vi.mock('../../../../pages/suppliers/hooks', () => ({
  useSuppliersBoardState: () => runtime.state,
}));

vi.mock('../../../../pages/suppliers/handlers', () => ({
  useToolbarHandlers: () => ({
    handleAddNew: runtime.handlers.handleAddNew,
    handleEdit: runtime.handlers.handleEdit,
    handleDelete: runtime.handlers.handleDelete,
  }),
  useSearchHandlers: () => ({
    handleSearchChange: runtime.handlers.handleSearchChange,
    handleSearchResultSelect: runtime.handlers.handleSearchResultSelect,
    handleClearSearchSelection: runtime.handlers.handleClearSearchSelection,
  }),
  useTableHandlers: () => ({
    handleRowClick: runtime.handlers.handleRowClick,
    handlePaginationChange: runtime.handlers.handlePaginationChange,
    handleSortChange: runtime.handlers.handleSortChange,
  }),
  useFilterHandlers: () => ({ handleToggleShowAll: runtime.handlers.handleToggleShowAll }),
  useDialogHandlers: () => ({
    handleSupplierCreated: runtime.handlers.handleSupplierCreated,
    handleSupplierUpdated: runtime.handlers.handleSupplierUpdated,
    handleSupplierDeleted: runtime.handlers.handleSupplierDeleted,
  }),
  useDataFetchingLogic: () => runtime.data,
}));

// Fixture builder: minimal SupplierRow with sensible defaults.
const supplierRow = (overrides: Partial<SupplierRow> = {}): SupplierRow => ({
  id: 'supplier-1',
  name: 'Supplier A',
  ...overrides,
});

// State builder: provides the full shape the board expects, while letting tests override just what matters.
const createState = (
  overrides: Partial<UseSuppliersBoardStateReturn> = {}
): UseSuppliersBoardStateReturn => ({
  searchQuery: '',
  showAllSuppliers: false,
  paginationModel: { page: 0, pageSize: 6 },
  sortModel: [{ field: 'name', sort: 'asc' }],
  selectedId: null,
  selectedSearchResult: null,
  openCreate: false,
  openEdit: false,
  openDelete: false,
  setSearchQuery: vi.fn(),
  setShowAllSuppliers: vi.fn(),
  setPaginationModel: vi.fn(),
  setSortModel: vi.fn(),
  setSelectedId: vi.fn(),
  setSelectedSearchResult: vi.fn(),
  setOpenCreate: vi.fn(),
  setOpenEdit: vi.fn(),
  setOpenDelete: vi.fn(),
  ...overrides,
});

const createData = (overrides: Partial<SuppliersBoardData> = {}): SuppliersBoardData => ({
  suppliers: [],
  total: 0,
  searchResults: [],
  isLoadingSuppliers: false,
  isLoadingSearch: false,
  error: null,
  ...overrides,
});

const renderBoard = () => render(<SuppliersBoard />);

describe('SuppliersBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runtime.user = { role: 'USER', isDemo: false };
    runtime.state = createState();
    runtime.data = createData();
  });

  it('renders the composition children (toolbar/search/filter/dialogs)', () => {
    renderBoard();

    expect(spies.SuppliersToolbar).toHaveBeenCalledTimes(1);
    expect(spies.SuppliersSearchPanel).toHaveBeenCalledTimes(1);
    expect(spies.SuppliersFilterPanel).toHaveBeenCalledTimes(1);
    expect(spies.SuppliersDialogs).toHaveBeenCalledTimes(1);
  });

  it('hides the table when showAllSuppliers is false and no search result is selected', () => {
    runtime.state = createState({ showAllSuppliers: false, selectedSearchResult: null });
    renderBoard();

    expect(spies.SuppliersTable).not.toHaveBeenCalled();
  });

  it('renders the paginated table rows when showAllSuppliers is true and nothing is selected', () => {
    const suppliers = [supplierRow({ id: 's-1', name: 'Acme' }), supplierRow({ id: 's-2', name: 'Beta' })];
    runtime.state = createState({ showAllSuppliers: true, selectedSearchResult: null });
    runtime.data = createData({ suppliers, total: 123 });

    renderBoard();

    // We intentionally only assert the board-owned projection (rows + rowCount).
    const tableProps = spies.SuppliersTable.mock.calls[0]?.[0] as { rows: SupplierRow[]; rowCount: number };
    expect(tableProps.rows).toEqual(suppliers);
    expect(tableProps.rowCount).toBe(123);
  });

  it('renders a single-row table when a supplier is selected from search', () => {
    const selected = supplierRow({ id: 'selected', name: 'Selected Supplier' });
    runtime.state = createState({ showAllSuppliers: false, selectedSearchResult: selected });
    runtime.data = createData({ suppliers: [supplierRow({ id: 'other', name: 'Other' })], total: 999 });

    renderBoard();

    const tableProps = spies.SuppliersTable.mock.calls[0]?.[0] as { rows: SupplierRow[]; rowCount: number };
    expect(tableProps.rows).toEqual([selected]);
    expect(tableProps.rowCount).toBe(1);
  });

  it.each([
    {
      name: 'disabled when no selection and non-admin non-demo',
      user: { role: 'USER', isDemo: false },
      selectedId: null,
      expected: { editEnabled: false, deleteEnabled: false },
    },
    {
      name: 'enabled when a row is selected',
      user: { role: 'USER', isDemo: false },
      selectedId: 'supplier-123',
      expected: { editEnabled: true, deleteEnabled: true },
    },
    {
      name: 'enabled for admin even without selection',
      user: { role: 'ADMIN', isDemo: false },
      selectedId: null,
      expected: { editEnabled: true, deleteEnabled: true },
    },
    {
      name: 'enabled for demo even without selection',
      user: { role: 'USER', isDemo: true },
      selectedId: null,
      expected: { editEnabled: true, deleteEnabled: true },
    },
  ])('computes toolbar enablement ($name)', ({ user, selectedId, expected }) => {
    runtime.user = user;
    runtime.state = createState({ selectedId });

    renderBoard();

    const toolbarProps = spies.SuppliersToolbar.mock.calls[0]?.[0] as {
      editEnabled: boolean;
      deleteEnabled: boolean;
    };

    expect(toolbarProps.editEnabled).toBe(expected.editEnabled);
    expect(toolbarProps.deleteEnabled).toBe(expected.deleteEnabled);
  });
});
