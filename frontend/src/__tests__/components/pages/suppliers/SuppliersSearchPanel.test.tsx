/**
 * @file SuppliersSearchPanel.test.tsx
 * @module __tests__/components/pages/suppliers/SuppliersSearchPanel
 * @description Contract tests for the `SuppliersSearchPanel` presentation component.
 *
 * Contract under test:
 * - Renders the title + placeholder and reflects the controlled `searchQuery` value.
 * - Shows a loading indicator when `isLoading` is true.
 * - Renders a results dropdown when `searchResults` exist and `selectedSupplier` is null.
 * - Delegates user intent via callbacks: `onSearchChange`, `onResultSelect`, `onClearSelection`.
 * - Hides the dropdown and shows a selected supplier summary when `selectedSupplier` is provided.
 *
 * Out of scope:
 * - Debouncing and search orchestration (owned by the board/orchestration hooks).
 * - MUI layout/styling details (we assert visible text and a11y roles only).
 *
 * Test strategy:
 * - Assert observable behavior using roles/text, not MUI implementation details.
 * - Use a controlled harness for typing tests to mirror React's controlled input loop.
 */

import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  SuppliersSearchPanel,
  type SuppliersSearchPanelProps,
} from '../../../../pages/suppliers/components/SuppliersSearchPanel';
import type { SupplierRow } from '../../../../api/suppliers';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

// Fixture builder: minimal SupplierRow with sensible defaults.
const supplierRow = (overrides: Partial<SupplierRow> = {}): SupplierRow => ({
  id: '1',
  name: 'Supplier A',
  contactName: 'John Doe',
  phone: '123-456-7890',
  email: 'john@suppliera.com',
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

/**
 * The real component is controlled (`value={searchQuery}`), so tests that type should
 * mirror that by updating the prop. This avoids the classic controlled-input pitfall
 * where the DOM value never updates and you only observe the last character.
 */
const ControlledHarness: React.FC<
  Omit<SuppliersSearchPanelProps, 'searchQuery' | 'onSearchChange'> & {
    onSearchChange: (query: string) => void;
  }
> = ({ onSearchChange, ...rest }) => {
  const [query, setQuery] = React.useState('');

  return (
    <SuppliersSearchPanel
      {...rest}
      searchQuery={query}
      onSearchChange={(next) => {
        setQuery(next);
        onSearchChange(next);
      }}
    />
  );
};

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

  it('renders title + input placeholder', () => {
    renderPanel(createProps());

    expect(screen.getByText('Search Supplier')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Enter supplier name (min 2 chars)...')
    ).toBeInTheDocument();
  });

  it('shows the provided searchQuery value', () => {
    renderPanel(createProps({ searchQuery: 'test' }));
    expect(screen.getByDisplayValue('test')).toBeInTheDocument();
  });

  it('emits incremental values while typing (controlled harness)', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();

    render(
      <ControlledHarness
        {...createProps({ onSearchChange })}
        isLoading={false}
        searchResults={[]}
        selectedSupplier={null}
      />
    );

    await user.type(
      screen.getByPlaceholderText('Enter supplier name (min 2 chars)...'),
      'sup'
    );

    expect(onSearchChange).toHaveBeenCalled();
    expect(onSearchChange).toHaveBeenLastCalledWith('sup');
  });

  it.each([
    { isLoading: true, expected: true },
    { isLoading: false, expected: false },
  ])('shows a loading indicator (isLoading=$isLoading)', ({ isLoading, expected }) => {
    renderPanel(createProps({ isLoading }));

    const progress = screen.queryByRole('progressbar');
    if (expected) {
      expect(progress).toBeInTheDocument();
    } else {
      expect(progress).not.toBeInTheDocument();
    }
  });

  it('renders a dropdown when results exist and no supplier is selected', () => {
    renderPanel(createProps({ searchResults: results }));

    expect(screen.getByText('Supplier A')).toBeInTheDocument();
    expect(screen.getByText('Supplier B')).toBeInTheDocument();
    expect(screen.getByText('Supplier C')).toBeInTheDocument();
    expect(screen.getByText('john@suppliera.com')).toBeInTheDocument();
    expect(screen.getByText('987-654-3210')).toBeInTheDocument();
    expect(screen.getByText('No contact info')).toBeInTheDocument();
  });

  it('calls onResultSelect when a result is clicked', async () => {
    const user = userEvent.setup();
    const props = createProps({ searchResults: results });
    renderPanel(props);

    await user.click(screen.getByText('Supplier A'));
    expect(props.onResultSelect).toHaveBeenCalledTimes(1);
    expect(props.onResultSelect).toHaveBeenCalledWith(results[0]);
  });

  it('hides dropdown and shows selected supplier details when selectedSupplier is set', () => {
    renderPanel(createProps({ searchResults: results, selectedSupplier: results[0] }));

    // Dropdown is hidden when a supplier is selected.
    expect(screen.queryByText('Supplier B')).not.toBeInTheDocument();

    // Selected supplier card is visible.
    expect(screen.getByText('Supplier A')).toBeInTheDocument();
    expect(screen.getByText(/Contact:\s*John Doe/)).toBeInTheDocument();
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('john@suppliera.com')).toBeInTheDocument();
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
