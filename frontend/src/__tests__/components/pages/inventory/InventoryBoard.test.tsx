/**
 * @file InventoryBoard.test.tsx
 * @module __tests__/components/pages/inventory/InventoryBoard
 * @description Contract tests for InventoryBoard orchestration:
 * - Composes toolbar, filters, table, and dialogs.
 * - Wires inventory state + handlers into child components.
 *
 * Out of scope:
 * - Child component internals (tested in their own suites).
 * - MUI rendering details.
 */

import './testSetup';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InventoryBoard from '@/pages/inventory/InventoryBoard';

// Mock external dependencies: keep assertions focused on composition.
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: null })),
}));

vi.mock('@/features/help', () => ({
  HelpIconButton: ({ tooltip }: { tooltip: string }) => (
    <button data-testid="help-button" title={tooltip}>
      Help
    </button>
  ),
}));

vi.mock('@/pages/inventory/hooks/useInventoryState', () => ({
  useInventoryState: vi.fn(() => ({
    q: '',
    supplierId: '1',
    belowMinOnly: false,
    selectedId: null,
    pageIndex: 0,
    pageSize: 10,
    sortBy: null,
    sortOrder: 'asc',
  })),
}));

// Mock inventory toolbar component
vi.mock('@/pages/inventory/components/InventoryToolbar', () => ({
  InventoryToolbar: ({ onAddNew }: { onAddNew: () => void }) => (
    <button data-testid="toolbar-add" onClick={onAddNew}>
      Add New
    </button>
  ),
}));

// Mock filter panel component
vi.mock('@/pages/inventory/components/InventoryFilterPanel', () => ({
  InventoryFilterPanel: ({ q, setQ }: { q: string; setQ: (q: string) => void }) => (
    <input data-testid="filter-search" value={q} onChange={(e) => setQ(e.target.value)} />
  ),
}));

// Mock inventory table component
vi.mock('@/pages/inventory/components/InventoryTable', () => ({
  InventoryTable: () => <div data-testid="inventory-table">Table</div>,
}));

// Mock inventory dialogs component
vi.mock('@/pages/inventory/components/InventoryDialogs', () => ({
  InventoryDialogs: () => <div data-testid="inventory-dialogs">Dialogs</div>,
}));

// Mock handlers
vi.mock('@/pages/inventory/handlers', () => ({
  useToolbarHandlers: () => ({
    handleAddNew: () => undefined,
    handleEdit: () => undefined,
    handleDelete: () => undefined,
    handleAdjustQty: () => undefined,
    handleChangePrice: () => undefined,
  }),
  useFilterHandlers: () => ({
    handleSearchChange: () => undefined,
    handleSupplierChange: () => undefined,
    handleBelowMinChange: () => undefined,
  }),
  useTableHandlers: () => ({
    handleRowClick: () => undefined,
    handlePaginationChange: () => undefined,
    handleSortChange: () => undefined,
  }),
  useRefreshHandler: () => ({
    handleReload: () => undefined,
  }),
  useDataFetchingLogic: vi.fn(() => ({
    server: {
      items: [
        { id: 1, name: 'Item 1', supplierId: 1 },
        { id: 2, name: 'Item 2', supplierId: 2 },
      ],
      total: 2,
      pageIndex: 0,
      pageSize: 10,
    },
    suppliers: [
      { id: 1, label: 'Supplier 1' },
      { id: 2, label: 'Supplier 2' },
    ],
    supplierLoading: false,
  })),
}));

describe('InventoryBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and composed children', () => {
    render(<InventoryBoard />);

    expect(screen.getByText('Inventory Management')).toBeInTheDocument();
    const helpButton = screen.getByTestId('help-button');
    expect(helpButton).toBeInTheDocument();
    expect(screen.getByTestId('toolbar-add')).toBeInTheDocument();
    expect(screen.getByTestId('filter-search')).toBeInTheDocument();
    expect(screen.getByTestId('inventory-table')).toBeInTheDocument();
    expect(screen.getByTestId('inventory-dialogs')).toBeInTheDocument();
  });
});
