/**
 * @file SuppliersTable.test.tsx
 * @module __tests__/components/pages/suppliers/SuppliersTable
 * @description Contract tests for the `SuppliersTable` presentation component.
 *
 * Contract under test:
 * - Renders column headers using i18n fallback strings.
 * - Delegates row click selection via `onRowClick`.
 * - Shows an empty-state message when there are no rows.
 * - Shows a loading indicator when `isLoading` is true.
 * - Wires server-side pagination/sorting props through to the DataGrid.
 *
 * Out of scope:
 * - MUI DataGrid rendering details and CSS/styling.
 * - Date formatting correctness (covered by formatter/util tests).
 *
 * Test strategy:
 * - Replace the DataGrid with a lightweight test double that renders only the pieces we assert.
 * - Assert observable text/roles and the props passed into the DataGrid.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuppliersTable, type SuppliersTableProps } from '../../../../pages/suppliers/components/SuppliersTable';
import type { SupplierRow } from '../../../../api/suppliers';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

// Deterministic settings: avoids coupling tests to user preference defaults.
const settings = vi.hoisted(() => ({
  useSettings: vi.fn(() => ({
    userPreferences: {
      dateFormat: 'MM/dd/yyyy',
      tableDensity: 'comfortable',
    },
  })),
}));

vi.mock('../../../../hooks/useSettings', () => settings);

type ColumnDef = { field: string; headerName: string };
type DataGridSlots = { noRowsOverlay?: () => React.ReactNode };
type DataGridTestProps = {
  rows: SupplierRow[];
  columns: ColumnDef[];
  slots?: DataGridSlots;
  onRowClick?: (params: { id: string | number }) => void;
  rowCount?: number;
  paginationMode?: string;
  sortingMode?: string;
  paginationModel?: unknown;
  sortModel?: unknown;
  density?: string;
  getRowId?: (row: SupplierRow) => string;
};

const dataGridMock = vi.hoisted(() => ({
  DataGrid: vi.fn<[DataGridTestProps], null>(() => null),
}));

// DataGrid test double:
// - Captures the full prop object for wiring assertions.
// - Renders only headers + clickable rows + the empty overlay to keep this test stable.
vi.mock('@mui/x-data-grid', () => ({
  DataGrid: (props: DataGridTestProps) => {
    dataGridMock.DataGrid(props);

    return (
      <div data-testid="data-grid">
        <div>
          {props.columns.map((c) => (
            <div key={c.field}>{c.headerName}</div>
          ))}
        </div>

        {props.rows.length === 0 && props.slots?.noRowsOverlay ? (
          <div data-testid="no-rows">{props.slots.noRowsOverlay()}</div>
        ) : (
          <div>
            {props.rows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => props.onRowClick?.({ id: r.id })}
              >
                {r.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
}));

const supplierRow = (overrides: Partial<SupplierRow> = {}): SupplierRow => ({
  id: '1',
  name: 'Supplier A',
  contactName: 'John Doe',
  phone: '123-456-7890',
  email: 'john@suppliera.com',
  createdAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

const createProps = (overrides: Partial<SuppliersTableProps> = {}): SuppliersTableProps => ({
  rows: [supplierRow(), supplierRow({ id: '2', name: 'Supplier B', contactName: null, phone: null, email: null })],
  rowCount: 2,
  paginationModel: { page: 0, pageSize: 6 },
  onPaginationChange: vi.fn(),
  sortModel: [],
  onSortChange: vi.fn(),
  isLoading: false,
  onRowClick: vi.fn(),
  ...overrides,
});

const renderTable = (props: SuppliersTableProps) => render(<SuppliersTable {...props} />);

describe('SuppliersTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders column headers using i18n fallbacks', () => {
    renderTable(createProps());

    expect(screen.getByText('Supplier Name')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
  });

  it('renders rows and delegates row clicks', async () => {
    const user = userEvent.setup();
    const props = createProps();

    renderTable(props);
    await user.click(screen.getByRole('button', { name: 'Supplier A' }));

    expect(props.onRowClick).toHaveBeenCalledTimes(1);
    expect(props.onRowClick).toHaveBeenCalledWith({ id: '1' });
  });

  it('renders an empty state via DataGrid slots when there are no rows', () => {
    renderTable(createProps({ rows: [], rowCount: 0 }));

    expect(screen.getByText('No suppliers found')).toBeInTheDocument();
  });

  it.each([
    { isLoading: true, expected: true },
    { isLoading: false, expected: false },
  ])('shows a loading indicator (isLoading=$isLoading)', ({ isLoading, expected }) => {
    renderTable(createProps({ isLoading }));

    const progress = screen.queryByRole('progressbar');
    if (expected) {
      expect(progress).toBeInTheDocument();
    } else {
      expect(progress).not.toBeInTheDocument();
    }
  });

  it('wires server-side pagination/sorting and forwards models/handlers to DataGrid', () => {
    const props = createProps({
      rowCount: 100,
      paginationModel: { page: 2, pageSize: 6 },
      sortModel: [{ field: 'name', sort: 'asc' }],
    });

    renderTable(props);

    expect(dataGridMock.DataGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        rowCount: 100,
        paginationMode: 'server',
        sortingMode: 'server',
        paginationModel: props.paginationModel,
        sortModel: props.sortModel,
        onPaginationModelChange: props.onPaginationChange,
        onSortModelChange: props.onSortChange,
      })
    );
  });
});
