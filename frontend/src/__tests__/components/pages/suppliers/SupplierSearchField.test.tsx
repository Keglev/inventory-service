/**
 * @file SupplierSearchField.test.tsx
 * @module __tests__/components/pages/suppliers/SupplierSearchField
 * @description Contract tests for the shared supplier search field (board,
 * edit dialog, delete dialog).
 *
 * Contract under test:
 * - Emits every edit through onQueryChange; the field is never disabled.
 * - Opens a list of at most six results, with a count of the rest.
 * - Shows the contact and an email or phone under a name, nothing otherwise.
 * - Mouse and keyboard (arrow + Enter) both pick a result through onSelect.
 * - Below two characters: a hint and no list; no match: the empty message.
 * - Escape closes the list without clearing the text.
 * - suppressResults hides the list (board, while a pick is shown).
 */

import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SupplierSearchField, type SupplierSearchFieldProps } from '../../../../pages/suppliers/components/SupplierSearchField';
import { matchSuppliers } from '../../../../pages/suppliers/utils/matchSuppliers';
import type { SupplierRow } from '../../../../api/suppliers/types';
import { tEn } from '../../../test/i18nEn';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => tEn(key, options) }),
}));

const row = (id: string, name: string, extra: Partial<SupplierRow> = {}): SupplierRow => ({
  id, name, contactName: null, email: null, phone: null, ...extra,
});

const ALL: SupplierRow[] = [
  row('1', 'Nordbay Industriebedarf GmbH', { contactName: 'Petra Lindner', email: 'p.lindner@example.com' }),
  row('2', 'Obi markt', { phone: '0911 123' }),
  ...Array.from({ length: 9 }, (_, i) => row(`g${i}`, `Getriebe Werk ${i + 1} GmbH`)),
];

// Mirrors the callers: the field is controlled, results come from matchSuppliers.
function Harness(props: Partial<SupplierSearchFieldProps> & { onSelect?: (s: SupplierRow) => void }) {
  const [query, setQuery] = React.useState('');
  return (
    <SupplierSearchField
      query={query}
      onQueryChange={setQuery}
      results={matchSuppliers(ALL, query)}
      loading={false}
      onSelect={props.onSelect ?? vi.fn()}
      {...props}
    />
  );
}

const input = () => screen.getByPlaceholderText('Enter supplier name (min 2 chars)...');

describe('SupplierSearchField', () => {
  it('emits every edit and stays editable while loading', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    render(<SupplierSearchField query="" onQueryChange={onQueryChange} results={[]} loading onSelect={vi.fn()} />);

    expect(input()).toBeEnabled();
    await user.type(input(), 'n');
    expect(onQueryChange).toHaveBeenLastCalledWith('n');
  });

  it('shows a hint and no list below two characters', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(input(), 'n');

    expect(screen.getByText('Type at least 2 characters to search')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('lists at most six matches and counts the rest', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(input(), 'werk');

    expect(screen.getAllByRole('option')).toHaveLength(6);
    expect(screen.getByText('3 more matches – keep typing to narrow down')).toBeInTheDocument();
  });

  it('shows contact and email or phone under the name, and nothing invented', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(input(), 'nord');
    expect(screen.getByText('Petra Lindner · p.lindner@example.com')).toBeInTheDocument();

    await user.clear(input());
    await user.type(input(), 'werk 1 ');
    const option = screen.getByRole('option', { name: 'Getriebe Werk 1 GmbH' });
    expect(option.textContent).toBe('Getriebe Werk 1 GmbH');
  });

  it('picks a result by click and by keyboard', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);

    await user.type(input(), 'obi');
    await user.click(screen.getByRole('option', { name: /Obi markt/ }));
    expect(onSelect).toHaveBeenLastCalledWith(ALL[1]);

    await user.clear(input());
    await user.type(input(), 'nord');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith(ALL[0]);
  });

  it('closes the list on Escape and keeps the typed text', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(input(), 'nord');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input()).toHaveValue('nord');
  });

  it('says so when nothing matches', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(input(), 'xyz');

    expect(screen.getByText('No suppliers found')).toBeInTheDocument();
  });

  it('hides the list when suppressResults is set', async () => {
    const user = userEvent.setup();
    render(<Harness suppressResults />);

    await user.type(input(), 'nord');

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});
