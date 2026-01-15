/**
 * @file DeleteSupplierSearch.test.tsx
 *
 * @what_is_under_test DeleteSupplierSearch component
 * @responsibility Render search workflow and delegate callbacks to subcomponents
 * @out_of_scope useDeleteSupplierForm hook logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SupplierRow } from '../../../../../api/suppliers/types';

const inputSpy = vi.fn();
const resultsSpy = vi.fn();
const emptySpy = vi.fn();

vi.mock('../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierSearchInput', () => ({
  DeleteSupplierSearchInput: (props: unknown) => {
    inputSpy(props);
    const { onChange } = props as { onChange: (value: string) => Promise<void> };
    return (
      <input
        aria-label="search-input"
        value={(props as { value: string }).value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  },
}));

vi.mock('../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierSearchResults', () => ({
  DeleteSupplierSearchResults: (props: unknown) => {
    resultsSpy(props);
    return <div data-testid="search-results" />;
  },
}));

vi.mock('../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierSearchEmpty', () => ({
  DeleteSupplierSearchEmpty: (props: unknown) => {
    emptySpy(props);
    return <div data-testid="empty-state" />;
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

import { DeleteSupplierSearch } from '../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierSearch';

const suppliers: SupplierRow[] = [
  { id: '1', name: 'Supplier One', contactName: 'Jane Doe', email: null, phone: null },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DeleteSupplierSearch', () => {
  it('renders title, help button, and delegates input props', async () => {
    const user = userEvent.setup();
    const onSearchQueryChange = vi.fn();
    const onHelp = vi.fn();

    render(
      <DeleteSupplierSearch
        searchQuery="su"
        onSearchQueryChange={onSearchQueryChange}
        searchResults={suppliers}
        searchLoading={false}
        onSelectSupplier={vi.fn()}
        onCancel={vi.fn()}
        onHelp={onHelp}
      />
    );

    expect(screen.getByRole('heading', { name: 'Delete Supplier' })).toBeInTheDocument();
    expect(inputSpy).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'su', isLoading: false })
    );

    await user.type(screen.getByLabelText('search-input'), 'x');
    expect(onSearchQueryChange).toHaveBeenCalledWith('sux');

    await user.click(screen.getByRole('button', { name: 'Help' }));
    expect(onHelp).toHaveBeenCalledTimes(1);
  });

  it('passes results and selection handler to results component', () => {
    const onSelectSupplier = vi.fn();

    render(
      <DeleteSupplierSearch
        searchQuery="supplier"
        onSearchQueryChange={vi.fn()}
        searchResults={suppliers}
        searchLoading={false}
        onSelectSupplier={onSelectSupplier}
        onCancel={vi.fn()}
        onHelp={vi.fn()}
      />
    );

    expect(resultsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ suppliers, onSelectSupplier })
    );
  });

  it('disables cancel button while loading and informs empty state props', () => {
    render(
      <DeleteSupplierSearch
        searchQuery="s"
        onSearchQueryChange={vi.fn()}
        searchResults={[]}
        searchLoading={true}
        onSelectSupplier={vi.fn()}
        onCancel={vi.fn()}
        onHelp={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(emptySpy).toHaveBeenCalledWith(
      expect.objectContaining({ hasSearched: false, isLoading: true })
    );
  });
});
