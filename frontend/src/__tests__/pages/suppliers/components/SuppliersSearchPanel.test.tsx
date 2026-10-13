/**
 * @file SuppliersSearchPanel.test.tsx
 * @module __tests__/pages/suppliers/SuppliersSearchPanel
 * @description Contract tests for the `SuppliersSearchPanel` presentation component.
 *
 * Contract under test:
 * - Renders the title and hands query, results, loading and callbacks to the
 *   shared SupplierSearchField.
 * - Hides the field's results while a supplier is selected, and shows that
 *   supplier's name with a Clear action that calls `onClearSelection`.
 *
 * Out of scope:
 * - The field's own behavior (SupplierSearchField.test.tsx); matching
 *   (matchSuppliers.test.ts).
 * - MUI layout/styling details (we assert visible text and a11y roles only).
 *
 * Test strategy:
 * - Assert observable behavior using roles/text, not MUI implementation details.
 * - Use a controlled harness for typing tests to mirror React's controlled input loop.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  SuppliersSearchPanel,
  type SuppliersSearchPanelProps,
} from '@/pages/suppliers/components/SuppliersSearchPanel';
import type { SupplierRow } from '@/api/suppliers/types';
import { tEn } from '@/__tests__/test/i18nEn';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => tEn(key, options) }),
}));

const fieldSpy = vi.hoisted(() => vi.fn());
vi.mock('@/pages/suppliers/components/SupplierSearchField', () => ({
  SupplierSearchField: (props: unknown) => {
    fieldSpy(props);
    return <div data-testid="supplier-search-field" />;
  },
}));

// Fixture builder: minimal SupplierRow with sensible defaults.
const supplierRow = (overrides: Partial<SupplierRow> = {}): SupplierRow => ({
  id: '1',
  name: 'Supplier A',
  contactName: 'John Doe',
  phone: '123-456-7890',
  email: 'john@supplier-a.example',
  createdAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

// Props builder: keeps tests focused on the prop(s) under test.
const createProps = (
  overrides: Partial<SuppliersSearchPanelProps> = {}
): SuppliersSearchPanelProps => ({
  searchQuery: '',
  onSearchChange: vi.fn(),
  isLoading: false,
  searchResults: [],
  onResultSelect: vi.fn(),
  selectedSupplier: null,
  onClearSelection: vi.fn(),
  ...overrides,
});

const renderPanel = (props: SuppliersSearchPanelProps) =>
  render(<SuppliersSearchPanel {...props} />);

describe('SuppliersSearchPanel', () => {
  const results: SupplierRow[] = [
    supplierRow(),
    supplierRow({
      id: '2',
      name: 'Supplier B',
      contactName: null,
      phone: '987-654-3210',
      email: null,
      createdAt: '2024-02-20T14:30:00Z',
    }),
    supplierRow({
      id: '3',
      name: 'Supplier C',
      contactName: null,
      phone: null,
      email: null,
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title and wires the shared search field', () => {
    const props = createProps({ searchQuery: 'sup', searchResults: results, isLoading: true });
    renderPanel(props);

    expect(screen.getByText('Search Supplier')).toBeInTheDocument();
    expect(fieldSpy).toHaveBeenCalledWith({
      query: 'sup',
      onQueryChange: props.onSearchChange,
      results,
      loading: true,
      onSelect: props.onResultSelect,
      suppressResults: false,
    });
  });

  it('hides dropdown and shows a compact selected indicator when selectedSupplier is set', () => {
    renderPanel(createProps({ searchResults: results, selectedSupplier: results[0] }));

    // The field's results are hidden while a supplier is selected.
    expect(fieldSpy).toHaveBeenLastCalledWith(expect.objectContaining({ suppressResults: true }));

    // Compact indicator: name + clear action only; the detail card was
    // removed as redundant with the table row.
    expect(screen.getByText('Supplier A')).toBeInTheDocument();
    expect(screen.queryByText(/Contact:\s*John Doe/)).not.toBeInTheDocument();
    expect(screen.queryByText('123-456-7890')).not.toBeInTheDocument();
    expect(screen.queryByText('john@supplier-a.example')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('delegates to onClearSelection when Clear is clicked', async () => {
    const user = userEvent.setup();
    const props = createProps({ selectedSupplier: results[0] });

    renderPanel(props);
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(props.onClearSelection).toHaveBeenCalledTimes(1);
  });
});
