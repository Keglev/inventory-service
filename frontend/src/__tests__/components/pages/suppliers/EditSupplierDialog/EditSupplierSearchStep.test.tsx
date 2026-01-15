/**
 * @file EditSupplierSearchStep.test.tsx
 *
 * @what_is_under_test EditSupplierSearchStep component
 * @responsibility Display search input, loading state, and search results list
 * @out_of_scope API integration, debouncing logic
 */

import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SupplierRow } from '../../../../../api/suppliers/types';

import { EditSupplierSearchStep } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/EditSupplierSearchStep';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

const defaultSupplier = (overrides: Partial<SupplierRow> = {}): SupplierRow => ({
  id: 'supplier-1',
  name: 'Acme Corp',
  contactName: 'Jane Smith',
  phone: '555-3000',
  email: 'jane@acme.com',
  createdBy: 'owner@example.com',
  createdAt: '2023-01-01',
  ...overrides,
});

describe('EditSupplierSearchStep', () => {
  it('renders heading and placeholder text', () => {
    render(
      <EditSupplierSearchStep
        searchQuery=""
        onSearchQueryChange={vi.fn()}
        searchResults={[]}
        searchLoading={false}
        onSelectSupplier={vi.fn()}
      />
    );

    expect(screen.getByText('Step 1: Search and Select Supplier')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter supplier name (min 2 chars)...')).toBeInTheDocument();
  });

  it('calls onSearchQueryChange when typing in the search field', async () => {
    const onSearchQueryChange = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    const Harness: React.FC = () => {
      const [query, setQuery] = React.useState('');
      return (
        <EditSupplierSearchStep
          searchQuery={query}
          onSearchQueryChange={async (value) => {
            setQuery(value);
            await onSearchQueryChange(value);
          }}
          searchResults={[]}
          searchLoading={false}
          onSelectSupplier={vi.fn()}
        />
      );
    };

    render(<Harness />);

    const input = screen.getByPlaceholderText('Enter supplier name (min 2 chars)...');
    await user.type(input, 'Ac');

    expect(onSearchQueryChange).toHaveBeenCalled();
    expect(onSearchQueryChange).toHaveBeenLastCalledWith('Ac');
  });

  it('disables the search field and shows a loader while searching', () => {
    render(
      <EditSupplierSearchStep
        searchQuery="Ac"
        onSearchQueryChange={vi.fn()}
        searchResults={[]}
        searchLoading={true}
        onSelectSupplier={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText('Enter supplier name (min 2 chars)...')).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders search results and triggers selection callback', async () => {
    const user = userEvent.setup();
    const onSelectSupplier = vi.fn();
    const results = [
      defaultSupplier(),
      defaultSupplier({ id: 'supplier-2', name: 'Bravo Supplies', email: 'hello@bravo.com' }),
    ];

    render(
      <EditSupplierSearchStep
        searchQuery="Ac"
        onSearchQueryChange={vi.fn()}
        searchResults={results}
        searchLoading={false}
        onSelectSupplier={onSelectSupplier}
      />
    );

    const firstResult = screen.getByRole('button', { name: /Acme Corp/ });
    await user.click(firstResult);
    expect(onSelectSupplier).toHaveBeenCalledWith(results[0]);
  });

  it('shows no results helper when search returns nothing', () => {
    render(
      <EditSupplierSearchStep
        searchQuery="Ac"
        onSearchQueryChange={vi.fn()}
        searchResults={[]}
        searchLoading={false}
        onSelectSupplier={vi.fn()}
      />
    );

    expect(screen.getByText('No suppliers found')).toBeInTheDocument();
  });

  it('displays guidance alert when query is too short', () => {
    render(
      <EditSupplierSearchStep
        searchQuery="A"
        onSearchQueryChange={vi.fn()}
        searchResults={[]}
        searchLoading={false}
        onSelectSupplier={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Type at least 2 characters to search');
  });
});
