/**
 * @file ItemAutocomplete.test.tsx
 * @module __tests__/pages/analytics/price-trend/ItemAutocomplete
 *
 * @summary
 * Tests ItemAutocomplete search scoping, option management, and selection callbacks.
 */

import type { SyntheticEvent } from 'react';
import { act } from 'react';
import type { MockedFunction } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AutocompleteProps, AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import type { ItemRef } from '@/api/analytics';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/hooks/useDebounced', () => ({
  useDebounced: <T,>(value: T) => value,
}));

vi.mock('@/api/analytics', () => ({
  searchItemsForSupplier: vi.fn(),
  searchItemsGlobal: vi.fn(),
}));

let latestAutocompleteProps: {
  onInputChange?: AutocompleteProps<ItemRef, false, false, false>['onInputChange'];
  onChange?: AutocompleteProps<ItemRef, false, false, false>['onChange'];
  options: ItemRef[];
  value: ItemRef | null;
} | null = null;

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual<typeof import('@mui/material')>('@mui/material');
  return {
    ...actual,
    Autocomplete: (props: AutocompleteProps<ItemRef, false, false, false>) => {
      latestAutocompleteProps = {
        onInputChange: props.onInputChange,
        onChange: props.onChange,
        options: props.options ? [...props.options] : [],
        value: props.value ?? null,
      };
      return (
        <div data-testid="item-autocomplete">
          {props.renderInput?.({
            id: 'mock-input',
            InputLabelProps: {},
            InputProps: {},
            inputProps: {},
            fullWidth: true,
          } as AutocompleteRenderInputParams)}
        </div>
      );
    },
  };
});

const { searchItemsForSupplier, searchItemsGlobal } = await import('@/api/analytics');
const ItemAutocomplete = (await import('@/pages/analytics/blocks/price-trend/ItemAutocomplete')).ItemAutocomplete;
const mockedSearchItemsForSupplier = searchItemsForSupplier as MockedFunction<typeof searchItemsForSupplier>;
const mockedSearchItemsGlobal = searchItemsGlobal as MockedFunction<typeof searchItemsGlobal>;

function triggerInput(value: string) {
  act(() => {
    const event = {} as SyntheticEvent<Element, Event>;
    latestAutocompleteProps?.onInputChange?.(event, value, 'input');
  });
}

function selectOption(option: ItemRef | null) {
  act(() => {
    const event = {} as SyntheticEvent<Element, Event>;
    latestAutocompleteProps?.onChange?.(event, option, 'selectOption');
  });
}

describe('ItemAutocomplete', () => {
  let queryClient: QueryClient;

  const renderAutocomplete = (props: Partial<React.ComponentProps<typeof ItemAutocomplete>>) =>
    render(
      <QueryClientProvider client={queryClient}>
        <ItemAutocomplete value={null} onChange={() => {}} {...props} />
      </QueryClientProvider>
    );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    latestAutocompleteProps = null;
    vi.clearAllMocks();
    mockedSearchItemsForSupplier.mockResolvedValue([]);
    mockedSearchItemsGlobal.mockResolvedValue([]);
  });

  it('scopes searches to the supplier when supplierId is provided', async () => {
    const handleChange = vi.fn();

    renderAutocomplete({ supplierId: 'sup-1', onChange: handleChange });

    await waitFor(() => expect(latestAutocompleteProps).not.toBeNull());
    const supplierResults: ItemRef[] = [{ id: 'itm-1', name: 'Widget', supplierId: 'sup-1' }];
    mockedSearchItemsForSupplier.mockResolvedValue(supplierResults);

    triggerInput('Wid');

    await waitFor(() => {
      expect(mockedSearchItemsForSupplier).toHaveBeenCalledWith('sup-1', 'Wid', 50);
      expect(latestAutocompleteProps?.options.length ?? 0).toBeGreaterThan(0);
    });

    selectOption(latestAutocompleteProps?.options[0] ?? null);
    expect(handleChange).toHaveBeenCalledWith(supplierResults[0]);
    expect(mockedSearchItemsGlobal).not.toHaveBeenCalled();
  });

  it('falls back to global search when supplierId is absent', async () => {
    renderAutocomplete({ supplierId: null });

    await waitFor(() => expect(latestAutocompleteProps).not.toBeNull());
    const globalResults: ItemRef[] = [{ id: 'itm-2', name: 'Global Widget' } as ItemRef];
    mockedSearchItemsGlobal.mockResolvedValue(globalResults);

    triggerInput('Glob');

    await waitFor(() => {
      expect(mockedSearchItemsGlobal).toHaveBeenCalledWith('Glob', 50);
      expect(latestAutocompleteProps?.options[0]).toEqual(globalResults[0]);
    });
  });

  it('retains the selected item in options when missing from results', async () => {
    const selectedItem: ItemRef = { id: 'itm-3', name: 'Sticky Widget', supplierId: 'sup-7' };

    render(
      <QueryClientProvider client={queryClient}>
        <ItemAutocomplete value={selectedItem} supplierId="sup-7" onChange={() => {}} />
      </QueryClientProvider>
    );

    await waitFor(() => expect(latestAutocompleteProps).not.toBeNull());

    triggerInput('Stick');

    await waitFor(() => {
      expect(mockedSearchItemsForSupplier).toHaveBeenCalledWith('sup-7', 'Stick', 50);
      expect(latestAutocompleteProps?.options.some((item) => item.id === selectedItem.id)).toBe(true);
      expect(latestAutocompleteProps?.value).toEqual(selectedItem);
    });
  });
});
