/**
 * @file ItemSearchAutocomplete.test.tsx
 * @module __tests__/components/pages/analytics/components/ItemSearchAutocomplete
 * @description Contract tests for the shared analytics item picker.
 *
 * Contract under test:
 * - Renders the provided options without re-filtering them (callers
 *   pre-filter; `filterOptions` is a passthrough).
 * - Selecting an option reports the selection AND mirrors the item name
 *   back into the input text (the invariant both hosts relied on).
 * - Typing reports raw input changes.
 * - The caller-computed helper text renders verbatim.
 *
 * Out of scope:
 * - Option-list enrichment, debounce, and search queries (owned by the
 *   callers and useItemSearchOptions, tested there).
 * - MUI Autocomplete internals (popup positioning, keyboard trivia).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemSearchAutocomplete } from '../../../../../pages/analytics/components/ItemSearchAutocomplete';
import type { ItemRef } from '../../../../../api/shared/types';

const ITEMS: ItemRef[] = [
  { id: 'i1', name: 'Copper Wire' },
  { id: 'i2', name: 'Steel Plate' },
];

function renderPicker(overrides: Partial<Parameters<typeof ItemSearchAutocomplete>[0]> = {}) {
  const onSelect = vi.fn();
  const onInputChange = vi.fn();
  render(
    <ItemSearchAutocomplete
      options={ITEMS}
      loading={false}
      value={null}
      inputValue=""
      onSelect={onSelect}
      onInputChange={onInputChange}
      label="Item"
      helperText=" "
      {...overrides}
    />,
  );
  return { onSelect, onInputChange };
}

describe('ItemSearchAutocomplete', () => {
  it('shows all provided options without client-side re-filtering', async () => {
    renderPicker({ inputValue: 'zzz' });
    await userEvent.click(screen.getByRole('combobox'));
    // 'zzz' matches neither option; a filtering Autocomplete would show none.
    expect(await screen.findByText('Copper Wire')).toBeInTheDocument();
    expect(screen.getByText('Steel Plate')).toBeInTheDocument();
  });

  it('reports the selection and mirrors the item name into the input', async () => {
    const { onSelect, onInputChange } = renderPicker();
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByText('Steel Plate'));
    expect(onSelect).toHaveBeenCalledWith(ITEMS[1]);
    expect(onInputChange).toHaveBeenCalledWith('Steel Plate');
  });

  it('reports raw typing through onInputChange', async () => {
    const { onInputChange } = renderPicker();
    await userEvent.type(screen.getByRole('combobox'), 'C');
    expect(onInputChange).toHaveBeenCalledWith('C');
  });

  it('renders the caller-computed helper text verbatim', () => {
    renderPicker({ helperText: 'Type at least 2 characters' });
    expect(screen.getByText('Type at least 2 characters')).toBeInTheDocument();
  });

  it('renders the current selection as the field value', () => {
    renderPicker({ value: ITEMS[0], inputValue: 'Copper Wire' });
    expect(screen.getByRole('combobox')).toHaveValue('Copper Wire');
  });

  it('reports a cleared selection without mirroring text into the input', async () => {
    const user = userEvent.setup();
    const { onSelect, onInputChange } = renderPicker({
      value: ITEMS[0],
      inputValue: 'Copper Wire',
    });

    await user.click(screen.getByRole('combobox'));
    onInputChange.mockClear();

    await user.click(screen.getByTitle('Clear'));

    // Clearing reports null upstream; the name-mirroring branch is skipped.
    expect(onSelect).toHaveBeenCalledWith(null);
    expect(onInputChange).not.toHaveBeenCalledWith('Copper Wire');
  });

  it('renders the caller-provided noOptionsText when the list is empty', async () => {
    const user = userEvent.setup();
    renderPicker({ options: [], noOptionsText: 'Nothing here' });

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}');

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});
