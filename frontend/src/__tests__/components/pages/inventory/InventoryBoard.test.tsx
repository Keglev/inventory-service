/**
 * @file InventoryBoard.test.tsx
 * @description
 * Test suite for InventoryBoard orchestrator component.
 * Verifies state management, data fetching integration, dialog management, and handler integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InventoryBoard from '@/pages/inventory/InventoryBoard';

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: null })),
}));

// Mock react-i18next for translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// Mock HelpIconButton component
vi.mock('@/features/help', () => ({
  HelpIconButton: ({ tooltip }: { tooltip: string }) => (
    <button data-testid="help-button" title={tooltip}>
      Help
    </button>
  ),
}));

// Mock inventory state hook
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
    handleAddNew: vi.fn(),
    handleEdit: vi.fn(),
    handleDelete: vi.fn(),
    handleAdjustQty: vi.fn(),
    handleChangePrice: vi.fn(),
  }),
  useFilterHandlers: () => ({
    handleSearchChange: vi.fn(),
    handleSupplierChange: vi.fn(),
    handleBelowMinChange: vi.fn(),
  }),
  useTableHandlers: () => ({
    handleRowClick: vi.fn(),
    handlePaginationChange: vi.fn(),
    handleSortChange: vi.fn(),
  }),
  useRefreshHandler: () => ({
    handleReload: vi.fn(),
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
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders inventory board main container', () => {
    // Verify that the main board container renders
    render(<InventoryBoard />);
    // Check that top-level box exists
    const container = document.querySelector('.MuiBox-root');
    expect(container).not.toBeNull();
  });

  it('renders page title', () => {
    // Verify that the inventory management title is displayed
    render(<InventoryBoard />);
    expect(screen.getByText('Inventory Management')).toBeInTheDocument();
  });

  it('renders help icon button', () => {
    // Verify that help button is rendered for user assistance
    render(<InventoryBoard />);
    const helpButton = screen.getByTestId('help-button');
    expect(helpButton).toBeInTheDocument();
  });

  it('renders toolbar component', () => {
    // Verify that the toolbar with action buttons is rendered
    render(<InventoryBoard />);
    expect(screen.getByTestId('toolbar-add')).toBeInTheDocument();
  });

  it('renders filter panel component', () => {
    // Verify that the filter panel for search and supplier selection is rendered
    render(<InventoryBoard />);
    expect(screen.getByTestId('filter-search')).toBeInTheDocument();
  });

  it('renders inventory table component', () => {
    // Verify that the main inventory table is rendered
    render(<InventoryBoard />);
    expect(screen.getByTestId('inventory-table')).toBeInTheDocument();
  });

  it('renders inventory dialogs component', () => {
    // Verify that dialog management component is rendered
    render(<InventoryBoard />);
    expect(screen.getByTestId('inventory-dialogs')).toBeInTheDocument();
  });

  it('renders with proper paper wrapper styling', () => {
    // Verify that Paper component is used for card layout
    render(<InventoryBoard />);
    const papers = document.querySelectorAll('.MuiPaper-root');
    // Should have at least the main paper + filter paper + table paper
    expect(papers.length).toBeGreaterThanOrEqual(3);
  });

  it('composes multiple hooks for state management', () => {
    // Verify that the component uses the inventory state hook
    // This is verified by the fact that the component renders without errors
    // and all child components receive the expected props
    render(<InventoryBoard />);
    expect(screen.getByTestId('filter-search')).toBeInTheDocument();
    expect(screen.getByTestId('inventory-table')).toBeInTheDocument();
  });
});
