/**
 * @file DeleteSupplierSearch.test.tsx
 * @module __tests__/components/pages/suppliers/DeleteSupplierDialog/DeleteSupplierSearch
 * @description Contract tests for the DeleteSupplierSearch step component.
 *
 * Contract under test:
 * - Renders the dialog title and opens the delete help topic.
 * - Hands query, results, loading and both callbacks to the shared
 *   SupplierSearchField unchanged.
 * - Cancel stays enabled while the supplier list loads.
 *
 * Out of scope:
 * - The field's own behavior (SupplierSearchField.test.tsx).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SupplierRow } from '@/api/suppliers/types';

const mocks = vi.hoisted(() => ({
  fieldSpy: vi.fn(),
  openHelp: vi.fn(),
}));

// The help affordance is the shared HelpIconButton, which resolves openHelp
// from the help hook; stubbed here so the component renders without a provider.
vi.mock('@/hooks/useHelp', () => ({
  useHelp: () => ({ openHelp: mocks.openHelp }),
}));

vi.mock('@/pages/suppliers/components/SupplierSearchField', () => ({
  SupplierSearchField: (props: unknown) => {
    mocks.fieldSpy(props);
    return <div data-testid="supplier-search-field" />;
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => tEn(key, options) }),
}));

import { DeleteSupplierSearch } from '@/pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierSearch';
import { tEn } from '@/__tests__/test/i18nEn';

const suppliers: SupplierRow[] = [
  { id: '1', name: 'Supplier One', contactName: 'Jane Doe', email: null, phone: null },
];

beforeEach(() => {
  vi.clearAllMocks();
});

const renderSearch = (overrides?: Partial<ComponentProps<typeof DeleteSupplierSearch>>) => {
  const props: ComponentProps<typeof DeleteSupplierSearch> = {
    searchQuery: '',
    onSearchQueryChange: vi.fn(),
    searchResults: [],
    searchLoading: false,
    onSelectSupplier: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };

  render(<DeleteSupplierSearch {...props} />);
  return props;
};

describe('DeleteSupplierSearch', () => {
  it('renders title and help, and wires the shared search field', async () => {
    const user = userEvent.setup();
    const props = renderSearch({ searchQuery: 'su', searchResults: suppliers });

    expect(screen.getByRole('heading', { name: 'Delete Supplier' })).toBeInTheDocument();
    expect(mocks.fieldSpy).toHaveBeenCalledWith({
      query: 'su',
      onQueryChange: props.onSearchQueryChange,
      results: suppliers,
      loading: false,
      onSelect: props.onSelectSupplier,
    });

    await user.click(screen.getByRole('button', { name: 'Help' }));
    expect(mocks.openHelp).toHaveBeenCalledWith('suppliers.delete');
  });

  it('keeps Cancel enabled while the list loads and delegates it', async () => {
    const user = userEvent.setup();
    const props = renderSearch({ searchLoading: true });

    const cancel = screen.getByRole('button', { name: 'Cancel' });
    expect(cancel).toBeEnabled();
    await user.click(cancel);
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });
});
