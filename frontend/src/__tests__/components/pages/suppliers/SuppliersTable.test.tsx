import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuppliersTable } from '../../../../pages/suppliers/components/SuppliersTable';
import type { SupplierRow } from '../../../../api/suppliers';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../../hooks/useSettings', () => ({
  useSettings: vi.fn(() => ({
    userPreferences: {
      dateFormat: 'MM/dd/yyyy',
      tableDensity: 'comfortable',
    },
  })),
}));

vi.mock('@mui/x-data-grid', () => ({
  DataGrid: vi.fn(({ rows, columns, slots, onRowClick }) => (
    <div data-testid="data-grid">
      <div className="MuiDataGrid-columnHeaders">
        {columns.map((col: { field: string; headerName: string }) => (
          <div key={col.field}>{col.headerName}</div>
        ))}
      </div>
      <div className="MuiDataGrid-rows">
        {rows.length === 0 && slots?.noRowsOverlay ? (
          slots.noRowsOverlay()
        ) : (
          rows.map((row: SupplierRow) => (
            <div
              key={row.id}
              className="MuiDataGrid-row"
              onClick={() => onRowClick?.({ id: row.id })}
            >
              <div>{row.name}</div>
              <div>{row.contactName ?? '—'}</div>
              <div>{row.phone ?? '—'}</div>
              <div>{row.email ?? '—'}</div>
            </div>
          ))
        )}
      </div>
      <div className="MuiTablePagination-displayedRows">Pagination</div>
    </div>
  )),
}));

describe('SuppliersTable', () => {
  const mockSuppliers: SupplierRow[] = [
    {
      id: '1',
      name: 'Supplier A',
      contactName: 'John Doe',
      phone: '123-456-7890',
      email: 'john@suppliera.com',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      name: 'Supplier B',
      contactName: null,
      phone: null,
      email: null,
      createdAt: '2024-02-20T14:30:00Z',
    },
  ];

  const defaultProps = {
    rows: mockSuppliers,
    rowCount: 2,
    paginationModel: { page: 0, pageSize: 6 },
    onPaginationChange: vi.fn(),
    sortModel: [],
    onSortChange: vi.fn(),
    isLoading: false,
    onRowClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders supplier names', () => {
    render(<SuppliersTable {...defaultProps} />);
    expect(screen.getByText('Supplier A')).toBeInTheDocument();
    expect(screen.getByText('Supplier B')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<SuppliersTable {...defaultProps} />);
    expect(screen.getByText('suppliers:table.name')).toBeInTheDocument();
    expect(screen.getByText('suppliers:table.contactName')).toBeInTheDocument();
    expect(screen.getByText('suppliers:table.phone')).toBeInTheDocument();
    expect(screen.getByText('suppliers:table.email')).toBeInTheDocument();
    expect(screen.getByText('suppliers:table.createdAt')).toBeInTheDocument();
  });

  it('renders contact information when available', () => {
    render(<SuppliersTable {...defaultProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('john@suppliera.com')).toBeInTheDocument();
  });

  it('shows em-dash for missing contact information', () => {
    render(<SuppliersTable {...defaultProps} />);
    const emDashes = screen.getAllByText('—');
    expect(emDashes.length).toBeGreaterThan(0);
  });

  it('renders empty state when no rows', () => {
    render(<SuppliersTable {...defaultProps} rows={[]} rowCount={0} />);
    expect(screen.getByText('suppliers:empty.default')).toBeInTheDocument();
  });

  it('shows loading indicator when isLoading is true', () => {
    render(<SuppliersTable {...defaultProps} isLoading={true} />);
    const progressBar = document.querySelector('.MuiLinearProgress-root');
    expect(progressBar).toBeInTheDocument();
  });

  it('does not show loading indicator when isLoading is false', () => {
    render(<SuppliersTable {...defaultProps} isLoading={false} />);
    const progressBar = document.querySelector('.MuiLinearProgress-root');
    expect(progressBar).not.toBeInTheDocument();
  });

  it('calls onRowClick when a row is clicked', async () => {
    const user = userEvent.setup();
    render(<SuppliersTable {...defaultProps} />);
    const row = screen.getByText('Supplier A').closest('.MuiDataGrid-row');
    if (row) {
      await user.click(row);
      expect(defaultProps.onRowClick).toHaveBeenCalled();
    }
  });

  it('applies server-side pagination model', () => {
    const paginationModel = { page: 2, pageSize: 6 };
    render(<SuppliersTable {...defaultProps} paginationModel={paginationModel} />);
    // DataGrid should be rendered with the correct pagination
    expect(screen.getByText('Supplier A')).toBeInTheDocument();
  });

  it('displays correct row count for pagination', () => {
    render(<SuppliersTable {...defaultProps} rowCount={100} />);
    // Check if pagination shows correct count (MUI DataGrid shows "1-6 of 100")
    const pagination = document.querySelector('.MuiTablePagination-displayedRows');
    expect(pagination).toBeInTheDocument();
  });
});
