/**
 * @file ListSearchField.test.tsx
 * @module __tests__/components/search/ListSearchField
 * @description Contract tests for the picker mode of the shared search field.
 * The search mode is covered through SupplierSearchField.test.
 *
 * Contract under test:
 * - A picked option stays in the field (value), and picking forwards it.
 * - Clearing the text clears the pick (onSelect(null)).
 * - A picked option outside the visible results is still offered first.
 * - The field is disabled only when the caller says so.
 */

import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListSearchField } from '@/components/search/ListSearchField';
import { tEn } from '@/__tests__/test/i18nEn';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => tEn(key, options) }),
}));

type Thing = { id: string; name: string };
const things: Thing[] = Array.from({ length: 8 }, (_, i) => ({ id: `t${i}`, name: `Thing ${i}` }));

function Picker({ onSelect, initial = null, disabled = false }: { onSelect: (t: Thing | null) => void; initial?: Thing | null; disabled?: boolean }) {
  const [query, setQuery] = React.useState(initial ? initial.name : '');
  const [value, setValue] = React.useState<Thing | null>(initial);
  const results = query.trim().length >= 2 ? things.filter((t) => t.name.toLowerCase().includes(query.trim().toLowerCase())) : [];
  return (
    <ListSearchField<Thing>
      query={query}
      onQueryChange={setQuery}
      results={results}
      loading={false}
      value={value}
      onSelect={(t) => {
        setValue(t);
        onSelect(t);
      }}
      getLabel={(t) => t.name}
      getKey={(t) => t.id}
      label="Thing"
      noResultsText="None"
      hintText="Two characters"
      disabled={disabled}
    />
  );
}

describe('ListSearchField (picker mode)', () => {
  it('keeps a picked option in the field', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Picker onSelect={onSelect} />);

    await user.type(screen.getByLabelText('Thing'), 'ing 3');
    await user.click(screen.getByRole('option', { name: 'Thing 3' }));

    expect(onSelect).toHaveBeenLastCalledWith(things[3]);
    expect(screen.getByLabelText('Thing')).toHaveValue('Thing 3');
  });

  it('clears the pick when the text is cleared', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Picker onSelect={onSelect} initial={things[2]} />);

    await user.clear(screen.getByLabelText('Thing'));

    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it('offers the picked option first when it is not among the visible results', async () => {
    const user = userEvent.setup();
    render(
      <ListSearchField<Thing>
        query="thing"
        onQueryChange={vi.fn()}
        results={things}
        loading={false}
        value={things[7]}
        onSelect={vi.fn()}
        getLabel={(t) => t.name}
        getKey={(t) => t.id}
        label="Thing"
        noResultsText="None"
        hintText="Two characters"
      />
    );

    await user.click(screen.getByLabelText('Thing'));

    const names = screen.getAllByRole('option').map((o) => o.textContent);
    expect(names).toEqual(['Thing 7', 'Thing 0', 'Thing 1', 'Thing 2', 'Thing 3', 'Thing 4', 'Thing 5']);
    expect(screen.getByText('2 more matches – keep typing to narrow down')).toBeInTheDocument();
  });

  it('is disabled only when the caller says so', () => {
    const { rerender } = render(<Picker onSelect={vi.fn()} />);
    expect(screen.getByLabelText('Thing')).toBeEnabled();

    rerender(<Picker onSelect={vi.fn()} disabled />);
    expect(screen.getByLabelText('Thing')).toBeDisabled();
  });
});
