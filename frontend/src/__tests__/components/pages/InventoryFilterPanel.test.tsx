/**
 * @file InventoryFilterPanel.test.tsx
 * @module __tests__/components/pages/InventoryFilterPanel
 * @description
 * Enterprise unit tests for InventoryFilterPanel.
 *
 * Contract:
 * - Renders all filter controls (search, supplier select, below-min checkbox).
 * - Search input is controlled and emits updates via `setQ`.
 * - Supplier select includes an "All suppliers" option and emits supplier id changes.
 * - Checkbox reflects `belowMinOnly` and emits boolean updates.
 * - Supplier select is disabled while supplier data is loading.
 *
 * Notes:
 * - We use test-utils render to ensure required providers (theme/router/i18n) are present.
 * - For MUI Select, we open the listbox before interacting with options.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, within } from '@testing-library/react';

import { render } from '@/__tests__/test/test-utils';
import { InventoryFilterPanel } from '@/pages/inventory/components/InventoryFilterPanel';
import type { SupplierOption } from '@/api/analytics/types';

// -----------------------------------------------------------------------------
// Hoisted mocks
// -----------------------------------------------------------------------------

const mockSetQ = vi.hoisted(() => vi.fn());
const mockSetSupplierId = vi.hoisted(() => vi.fn());
const mockSetBelowMinOnly = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

const suppliersFixture: SupplierOption[] = [
  { id: '1', label: 'Supplier A' },
  { id: '2', label: 'Supplier B' },
  { id: '3', label: 'Supplier C' },
];

type Props = React.ComponentProps<typeof InventoryFilterPanel>;

function setup(overrides: Partial<Props> = {}) {
  const props: Props = {
    q: '',
    setQ: mockSetQ,
    supplierId: null,
    setSupplierId: mockSetSupplierId,
    belowMinOnly: false,
    setBelowMinOnly: mockSetBelowMinOnly,
    suppliers: suppliersFixture,
    supplierLoading: false,
    ...overrides,
  };

  const renderResult = render(<InventoryFilterPanel {...props} />);

  return {
    ...renderResult,
    rerenderWith: (next: Partial<Props>) =>
      renderResult.rerender(<InventoryFilterPanel {...props} {...next} />),
  };
}

async function openSupplierSelect(user: ReturnType<typeof userEvent.setup>) {
  const select = screen.getByRole('combobox');
  await user.click(select);
  return screen.getByRole('listbox');
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('InventoryFilterPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all filter controls', () => {
    setup();

    expect(screen.getByRole('textbox', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /below minimum quantity only/i }),
    ).toBeInTheDocument();
  });

  it('renders the search field with the current q value', () => {
    setup({ q: 'test search' });

    expect(screen.getByRole('textbox', { name: /search/i })).toHaveValue('test search');
  });

  it('calls setQ with the updated value when the user types', async () => {
    const user = userEvent.setup();
    const { rerenderWith } = setup();

    const input = screen.getByRole('textbox', { name: /search/i });
    let composed = '';

    for (const char of 'widget') {
      await user.type(input, char);
      composed += char;
      expect(mockSetQ).toHaveBeenLastCalledWith(composed);
      rerenderWith({ q: composed });
    }
  });

  it('calls setQ with an empty string when the user clears the search', async () => {
    const user = userEvent.setup();
    setup({ q: 'initial' });

    const input = screen.getByRole('textbox', { name: /search/i });
    await user.clear(input);

    expect(mockSetQ).toHaveBeenCalledWith('');
  });

  it('renders supplier dropdown options including "All suppliers"', async () => {
    const user = userEvent.setup();
    setup();

    const listbox = await openSupplierSelect(user);

    expect(within(listbox).getByRole('option', { name: /all suppliers/i })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Supplier A' })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Supplier B' })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Supplier C' })).toBeInTheDocument();
  });

  it('calls setSupplierId with the supplier id when a supplier is selected', async () => {
    const user = userEvent.setup();
    setup();

    await openSupplierSelect(user);
    await user.click(screen.getByRole('option', { name: 'Supplier A' }));

    expect(mockSetSupplierId).toHaveBeenCalledWith('1');
  });

  it('calls setSupplierId with null when "All suppliers" is selected', async () => {
    const user = userEvent.setup();
    setup({ supplierId: '1' });

    await openSupplierSelect(user);
    await user.click(screen.getByRole('option', { name: /all suppliers/i }));

    expect(mockSetSupplierId).toHaveBeenCalledWith(null);
  });

  it('reflects belowMinOnly as unchecked by default and checked when true', () => {
    const { rerenderWith } = setup();
    expect(
      screen.getByRole('checkbox', { name: /below minimum quantity only/i }),
    ).not.toBeChecked();

    rerenderWith({ belowMinOnly: true });
    expect(
      screen.getByRole('checkbox', { name: /below minimum quantity only/i }),
    ).toBeChecked();
  });

  it('calls setBelowMinOnly with the next value when the checkbox is toggled', async () => {
    const user = userEvent.setup();
    setup({ belowMinOnly: false });

    const checkbox = screen.getByRole('checkbox', { name: /below minimum quantity only/i });
    await user.click(checkbox);

    expect(mockSetBelowMinOnly).toHaveBeenCalledWith(true);
  });

  it('disables the supplier dropdown when supplierLoading is true', () => {
    setup({ supplierLoading: true });

    // MUI Select uses aria-disabled when disabled.
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not crash when suppliers is empty or undefined', () => {
    const { rerenderWith } = setup({ suppliers: [] });
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    rerenderWith({ suppliers: undefined });
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows the selected supplier label when supplierId matches an option', () => {
    setup({ supplierId: '2' });

    // MUI Select renders the selected label in the closed state.
    expect(screen.getByText('Supplier B')).toBeInTheDocument();
  });
});
