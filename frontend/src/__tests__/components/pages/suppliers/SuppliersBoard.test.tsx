import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import SuppliersBoard from '../../../../pages/suppliers/SuppliersBoard';

// Mock all components
vi.mock('../../../../pages/suppliers/components', () => ({
  SuppliersToolbar: vi.fn(({ onCreateClick, editEnabled, onEditClick, deleteEnabled, onDeleteClick }) => (
    <div data-testid="suppliers-toolbar">
      <button onClick={onCreateClick}>Create</button>
      <button onClick={onEditClick} disabled={!editEnabled}>Edit</button>
      <button onClick={onDeleteClick} disabled={!deleteEnabled}>Delete</button>
    </div>
  )),
  SuppliersSearchPanel: vi.fn(({ searchQuery, onSearchChange }) => (
    <div data-testid="suppliers-search-panel">
      <input value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
    </div>
  )),
  SuppliersFilterPanel: vi.fn(({ showAllSuppliers, onToggleChange }) => (
    <div data-testid="suppliers-filter-panel">
      <input type="checkbox" checked={showAllSuppliers} onChange={(e) => onToggleChange(e.target.checked)} />
    </div>
  )),
  SuppliersTable: vi.fn(({ rows }) => (
    <div data-testid="suppliers-table">
      {rows.map((row: { id: number; name: string }) => (
        <div key={row.id}>{row.name}</div>
      ))}
    </div>
  )),
  SuppliersDialogs: vi.fn(() => <div data-testid="suppliers-dialogs" />),
}));

// Mock hooks
vi.mock('../../../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { id: 1, role: 'USER', isDemo: false } })),
}));

vi.mock('../../../../pages/suppliers/hooks', () => ({
  useSuppliersBoardState: vi.fn(() => ({
    searchQuery: '',
    searchResults: [],
    selectedSearchResult: null,
    showAllSuppliers: false,
    selectedId: null,
    paginationModel: { page: 0, pageSize: 10 },
    sortModel: [],
    openCreate: false,
    openEdit: false,
    openDelete: false,
    setOpenCreate: vi.fn(),
    setOpenEdit: vi.fn(),
    setOpenDelete: vi.fn(),
  })),
}));

vi.mock('../../../../pages/suppliers/handlers', () => ({
  useToolbarHandlers: vi.fn(() => ({
    handleAddNew: vi.fn(),
    handleEdit: vi.fn(),
    handleDelete: vi.fn(),
  })),
  useSearchHandlers: vi.fn(() => ({
    handleSearchChange: vi.fn(),
    handleSearchResultSelect: vi.fn(),
    handleClearSearchSelection: vi.fn(),
  })),
  useTableHandlers: vi.fn(() => ({
    handleRowClick: vi.fn(),
    handlePaginationChange: vi.fn(),
    handleSortChange: vi.fn(),
  })),
  useFilterHandlers: vi.fn(() => ({
    handleToggleShowAll: vi.fn(),
  })),
  useDialogHandlers: vi.fn(() => ({
    handleSupplierCreated: vi.fn(),
    handleSupplierUpdated: vi.fn(),
    handleSupplierDeleted: vi.fn(),
  })),
  useDataFetchingLogic: vi.fn(() => ({
    suppliers: [],
    total: 0,
    isLoadingSuppliers: false,
    searchResults: [],
    isLoadingSearch: false,
  })),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('SuppliersBoard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SuppliersBoard />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders all main components', () => {
    renderComponent();
    expect(screen.getByTestId('suppliers-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('suppliers-search-panel')).toBeInTheDocument();
    expect(screen.getByTestId('suppliers-filter-panel')).toBeInTheDocument();
    expect(screen.getByTestId('suppliers-dialogs')).toBeInTheDocument();
  });

  it('does not render table when showAllSuppliers is false and no search selection', () => {
    renderComponent();
    expect(screen.queryByTestId('suppliers-table')).not.toBeInTheDocument();
  });

  it('renders toolbar with action buttons', () => {
    renderComponent();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders search panel', () => {
    renderComponent();
    expect(screen.getByTestId('suppliers-search-panel')).toBeInTheDocument();
  });

  it('renders filter panel', () => {
    renderComponent();
    expect(screen.getByTestId('suppliers-filter-panel')).toBeInTheDocument();
  });

  it('renders dialogs container', () => {
    renderComponent();
    expect(screen.getByTestId('suppliers-dialogs')).toBeInTheDocument();
  });
});
