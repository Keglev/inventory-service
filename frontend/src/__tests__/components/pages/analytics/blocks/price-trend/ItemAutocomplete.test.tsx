/**
 * @file ItemAutocomplete.test.tsx
 * @module __tests__/components/pages/analytics/blocks/price-trend/ItemAutocomplete
 * @description
 * Enterprise tests for ItemAutocomplete:
 * - Search scoping (supplier vs global)
 * - Option management (retains selected value even if not returned)
 * - Selection callback contract
 *
 * Strategy:
 * - We mock MUI Autocomplete to capture props (options/value/onChange/onInputChange),
 *   then drive the component via those callbacks. This avoids DOM fragility while still
 *   validating the hook/query behavior and prop wiring.
 */

import type { SyntheticEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AutocompleteProps, AutocompleteRenderInputParams } from '@mui/material/Autocomplete';

import type { ItemRef } from '@/api/analytics';
import { searchItemsForSupplier, searchItemsGlobal } from '@/api/analytics';
import { ItemAutocomplete } from '@/pages/analytics/blocks/price-trend/ItemAutocomplete';

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Prefer fallback to keep assertions stable across languages.
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/hooks/useDebounced', () => ({
  // Deterministic tests: debounce becomes identity.
  useDebounced: <T,>(value: T) => value,
}));

const mockSearchItemsForSupplier = vi.hoisted(() => vi.fn());
const mockSearchItemsGlobal = vi.hoisted(() => vi.fn());

vi.mock('@/api/analytics', () => ({
  searchItemsForSupplier: mockSearchItemsForSupplier,
  searchItemsGlobal: mockSearchItemsGlobal,
}));

/**
 * Captured Autocomplete props from the most recent render.
 * This lets us "drive" the component without relying on MUI DOM structure.
 */
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
          {props.renderInput?.(
            {
              id: 'mock-input',
              InputLabelProps: {},
              InputProps: {},
              inputProps: {},
              fullWidth: true,
            } as AutocompleteRenderInputParams,
          )}
        </div>
      );
    },
  };
});

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function renderWithClient(
  client: QueryClient,
  props: Partial<React.ComponentProps<typeof ItemAutocomplete>> = {},
) {
  return render(
    <QueryClientProvider client={client}>
      <ItemAutocomplete value={null} onChange={() => {}} {...props} />
    </QueryClientProvider>,
  );
}

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

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('ItemAutocomplete', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    latestAutocompleteProps = null;

    queryClient = createQueryClient();

    // Safe defaults: queries resolve to empty lists unless a test overrides them.
    vi.mocked(searchItemsForSupplier).mockResolvedValue([]);
    vi.mocked(searchItemsGlobal).mockResolvedValue([]);
  });

  it('scopes searches to the supplier when supplierId is provided', async () => {
    const handleChange = vi.fn();
    renderWithClient(queryClient, { supplierId: 'sup-1', onChange: handleChange });

    await waitFor(() => expect(latestAutocompleteProps).not.toBeNull());

    const supplierResults: ItemRef[] = [{ id: 'itm-1', name: 'Widget', supplierId: 'sup-1' }];
    vi.mocked(searchItemsForSupplier).mockResolvedValue(supplierResults);

    triggerInput('Wid');

    await waitFor(() => {
      expect(searchItemsForSupplier).toHaveBeenCalledWith('sup-1', 'Wid', 50);
      expect((latestAutocompleteProps?.options.length ?? 0) > 0).toBe(true);
    });

    selectOption(latestAutocompleteProps?.options[0] ?? null);

    expect(handleChange).toHaveBeenCalledWith(supplierResults[0]);
    expect(searchItemsGlobal).not.toHaveBeenCalled();
  });

  it('falls back to global search when supplierId is absent', async () => {
    renderWithClient(queryClient, { supplierId: null });

    await waitFor(() => expect(latestAutocompleteProps).not.toBeNull());

    const globalResults: ItemRef[] = [{ id: 'itm-2', name: 'Global Widget' } as ItemRef];
    vi.mocked(searchItemsGlobal).mockResolvedValue(globalResults);

    triggerInput('Glob');

    await waitFor(() => {
      expect(searchItemsGlobal).toHaveBeenCalledWith('Glob', 50);
      expect(latestAutocompleteProps?.options[0]).toEqual(globalResults[0]);
    });

    expect(searchItemsForSupplier).not.toHaveBeenCalled();
  });

  it('retains the selected item in options when missing from the latest results', async () => {
    const selectedItem: ItemRef = { id: 'itm-3', name: 'Sticky Widget', supplierId: 'sup-7' };

    render(
      <QueryClientProvider client={queryClient}>
        <ItemAutocomplete value={selectedItem} supplierId="sup-7" onChange={() => {}} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(latestAutocompleteProps).not.toBeNull());

    // Simulate a search that returns no results; selected item should remain available.
    vi.mocked(searchItemsForSupplier).mockResolvedValue([]);

    triggerInput('Stick');

    await waitFor(() => {
      expect(searchItemsForSupplier).toHaveBeenCalledWith('sup-7', 'Stick', 50);
      expect(latestAutocompleteProps?.options.some(item => item.id === selectedItem.id)).toBe(true);
      expect(latestAutocompleteProps?.value).toEqual(selectedItem);
    });
  });
});
