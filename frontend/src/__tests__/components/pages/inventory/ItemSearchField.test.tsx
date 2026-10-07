/**
 * @file ItemSearchField.test.tsx
 * @module __tests__/components/pages/inventory/ItemSearchField
 * @description Contract tests for the item picker of the inventory dialogs.
 *
 * Contract under test:
 * - Labelled "Item"; the placeholder asks for a supplier while disabled and
 *   for a name or SKU otherwise.
 * - The SKU is the second line of a result; an item without one shows its
 *   name only.
 * - Picking forwards the item; the inventory texts are used for the hint
 *   and the empty result.
 */

import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemSearchField } from '@/pages/inventory/components/ItemSearchField';
import { matchItems } from '@/api/inventory/matchItems';
import type { ItemOption } from '@/api/analytics/types';
import { tEn } from '@/__tests__/test/i18nEn';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => tEn(key, options) }),
}));

const items: ItemOption[] = [
  { id: 'I-1', name: 'EUR-1 Wooden Pallet', sku: 'LOG-PAL-EUR1' },
  { id: 'I-2', name: 'Kleber Ponal Express' },
];

function Harness({ onSelect = vi.fn(), disabled = false }: { onSelect?: (item: ItemOption | null) => void; disabled?: boolean }) {
  const [query, setQuery] = React.useState('');
  const [value, setValue] = React.useState<ItemOption | null>(null);
  return (
    <ItemSearchField
      query={query}
      onQueryChange={setQuery}
      results={matchItems(items, query)}
      loading={false}
      value={value}
      onSelect={(item) => {
        setValue(item);
        onSelect(item);
      }}
      disabled={disabled}
    />
  );
}

describe('ItemSearchField', () => {
  it('asks for a supplier while disabled, for a name or SKU otherwise', () => {
    const { rerender } = render(<Harness disabled />);
    expect(screen.getByPlaceholderText('Please select a supplier first to enable searching.')).toBeDisabled();

    rerender(<Harness />);
    expect(screen.getByPlaceholderText('Enter item name or SKU (min 2 chars)...')).toBeEnabled();
    expect(screen.getByLabelText('Item')).toBeInTheDocument();
  });

  it('finds an item by SKU and shows the SKU under its name', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);

    await user.type(screen.getByLabelText('Item'), 'pal-eur');
    const option = screen.getByRole('option', { name: /EUR-1 Wooden Pallet/ });
    expect(option.textContent).toBe('EUR-1 Wooden PalletLOG-PAL-EUR1');

    await user.click(option);
    expect(onSelect).toHaveBeenLastCalledWith(items[0]);
  });

  it('shows the name only for an item without a SKU', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText('Item'), 'ponal');

    expect(screen.getByRole('option').textContent).toBe('Kleber Ponal Express');
  });

  it('hints under two characters and reports no match after', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText('Item'), 'x');
    expect(screen.getByText('Enter at least 2 characters to search')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Item'), 'y');
    expect(screen.getByText('No items found for this search.')).toBeInTheDocument();
  });
});
