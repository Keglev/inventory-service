/**
 * @file DeleteSupplierSearch.test.tsx
 * @module __tests__/components/pages/suppliers/DeleteSupplierDialog/DeleteSupplierSearch
 * @description Contract tests for the DeleteSupplierSearch step component.
 *
 * Contract under test:
 * - Renders the dialog title and help affordance.
 * - Delegates props to subcomponents:
 *   - input receives value + loading state and forwards change events.
 *   - results receives supplier list + selection handler.
 *   - empty state receives hasSearched + loading state.
 * - Disables cancel while loading.
 *
 * Out of scope:
 * - Search orchestration (handled by workflow hook tests).
 * - MUI layout details (we assert accessible roles/text and prop wiring only).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import type { SupplierRow } from '../../../../../api/suppliers/types';

type DeleteSupplierSearchInputProps = {
  value: string;
  onChange: (value: string) => Promise<void>;
  isLoading: boolean;
};

type DeleteSupplierSearchResultsProps = {
  suppliers: SupplierRow[];
  onSelectSupplier: (supplier: SupplierRow) => void;
};

type DeleteSupplierSearchEmptyProps = {
  hasSearched: boolean;
  isLoading: boolean;
};

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
const mocks = vi.hoisted(() => ({
  inputSpy: vi.fn(),
  resultsSpy: vi.fn(),
  emptySpy: vi.fn(),
}));

vi.mock('../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierSearchInput', () => ({
  DeleteSupplierSearchInput: (props: DeleteSupplierSearchInputProps) => {
    mocks.inputSpy(props);
    return (
      <input
        aria-label="search-input"
        value={props.value}
        onChange={(event) => {
          void props.onChange(event.target.value);
        }}
      />
    );
  },
}));

vi.mock('../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierSearchResults', () => ({
  DeleteSupplierSearchResults: (props: DeleteSupplierSearchResultsProps) => {
    mocks.resultsSpy(props);
    return <div data-testid="search-results" />;
  },
}));

vi.mock('../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierSearchEmpty', () => ({
  DeleteSupplierSearchEmpty: (props: DeleteSupplierSearchEmptyProps) => {
    mocks.emptySpy(props);
    return <div data-testid="empty-state" />;
  },
}));

vi.mock('react-i18next', () => ({
  // Prefer fallback/defaultValue to keep assertions stable across locales.
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

import { DeleteSupplierSearch } from '../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierSearch';

const suppliers: SupplierRow[] = [
  { id: '1', name: 'Supplier One', contactName: 'Jane Doe', email: null, phone: null },
];

beforeEach(() => {
  vi.clearAllMocks();
});

const renderSearch = (overrides?: Partial<ComponentProps<typeof DeleteSupplierSearch>>) => {
  const props: ComponentProps<typeof DeleteSupplierSearch> = {
    searchQuery: '',
    onSearchQueryChange: vi.fn(async () => undefined),
    searchResults: [],
    searchLoading: false,
    onSelectSupplier: vi.fn(),
    onCancel: vi.fn(),
    onHelp: vi.fn(),
    ...overrides,
  };

  render(<DeleteSupplierSearch {...props} />);
  return props;
};

describe('DeleteSupplierSearch', () => {
  it('renders title, help button, and delegates input props', async () => {
    const user = userEvent.setup();
    const onSearchQueryChange = vi.fn();
    const onHelp = vi.fn();

    renderSearch({
      searchQuery: 'su',
      onSearchQueryChange,
      searchResults: suppliers,
      onHelp,
    });

    expect(screen.getByRole('heading', { name: 'Delete Supplier' })).toBeInTheDocument();
    expect(mocks.inputSpy).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'su', isLoading: false })
    );

    await user.type(screen.getByLabelText('search-input'), 'x');
    expect(onSearchQueryChange).toHaveBeenCalledWith('sux');

    await user.click(screen.getByRole('button', { name: 'Help' }));
    expect(onHelp).toHaveBeenCalledTimes(1);
  });

  it('passes results and selection handler to results component', () => {
    const onSelectSupplier = vi.fn();

    renderSearch({
      searchQuery: 'supplier',
      searchResults: suppliers,
      onSelectSupplier,
    });

    expect(mocks.resultsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ suppliers, onSelectSupplier })
    );
  });

  it('disables cancel button while loading and informs empty state props', () => {
    renderSearch({
      searchQuery: 's',
      searchResults: [],
      searchLoading: true,
    });

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(mocks.emptySpy).toHaveBeenCalledWith(
      expect.objectContaining({ hasSearched: false, isLoading: true })
    );
  });
});
