/**
 * @file InventoryFilterPanel.test.tsx
 * @module __tests__/components/pages/InventoryFilterPanel
 * @description Contract tests for the `InventoryFilterPanel` presentation component.
 *
 * Contract under test:
 * - Renders the three filter controls: supplier select, search input, below-min checkbox.
 * - Search input is controlled and emits updates via `setQ(next)`.
 * - Supplier select includes an "All suppliers" option and emits supplier id changes.
 * - Checkbox reflects `belowMinOnly` and emits boolean updates.
 * - Supplier select is disabled while supplier data is loading.
 *
 * Out of scope:
 * - MUI Select/TextField implementation details and styling.
 * - Any data fetching or debouncing (owned by inventory orchestration).
 *
 * Test strategy:
 * - Use the shared test-utils `render` for required providers.
 * - Use deterministic i18n fallbacks for stable accessible names.
 * - Use a controlled harness where needed to accurately simulate controlled inputs.
 */

import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, within } from '@testing-library/react';

import { render } from '@/__tests__/test/test-utils';
import { InventoryFilterPanel } from '@/pages/inventory/components/InventoryFilterPanel';
import type { SupplierOption } from '@/api/analytics/types';

// -----------------------------------------------------------------------------
// Hoisted mocks
// -----------------------------------------------------------------------------

const mockSetQ = vi.fn();
const mockSetSupplierId = vi.fn();
const mockSetBelowMinOnly = vi.fn();

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
  // MUI Select renders a combobox button; opening it makes the listbox/options available.
  const select = screen.getByRole('combobox');
  await user.click(select);
  return screen.getByRole('listbox');
}

/**
 * Controlled harness:
 * `InventoryFilterPanel` is fully controlled via props; tests that type should update `q`
 * to reflect what React would do in real usage.
 */
const ControlledHarness: React.FC<
  Omit<Props, 'q' | 'setQ'> & {
    initialQ?: string;
  }
> = ({ initialQ = '', ...rest }) => {
  const [q, setQ] = React.useState(initialQ);

  return (
    <InventoryFilterPanel
      {...rest}
      q={q}
      setQ={(next) => {
        setQ(next);
        mockSetQ(next);
      }}
    />
  );
};

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

  it('projects the current q value and emits updates (controlled)', async () => {
    const user = userEvent.setup();

    render(
      <ControlledHarness
        initialQ="initial"
        supplierId={null}
        setSupplierId={mockSetSupplierId}
        belowMinOnly={false}
        setBelowMinOnly={mockSetBelowMinOnly}
        suppliers={suppliersFixture}
        supplierLoading={false}
      />
    );

    const input = screen.getByRole('textbox', { name: /search/i });
    expect(input).toHaveValue('initial');

    await user.clear(input);
    expect(mockSetQ).toHaveBeenLastCalledWith('');

    await user.type(input, 'widget');
    expect(mockSetQ).toHaveBeenCalled();
    expect(mockSetQ).toHaveBeenLastCalledWith('widget');
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

  it.each([
    { label: 'Supplier A', expectedId: '1' },
    { label: 'Supplier B', expectedId: '2' },
    { label: 'Supplier C', expectedId: '3' },
  ])('calls setSupplierId when a supplier is selected ($label)', async ({ label, expectedId }) => {
    const user = userEvent.setup();
    setup();

    await openSupplierSelect(user);
    await user.click(screen.getByRole('option', { name: label }));

    expect(mockSetSupplierId).toHaveBeenCalledWith(expectedId);
  });

  it('calls setSupplierId with null when "All suppliers" is selected', async () => {
    const user = userEvent.setup();
    setup({ supplierId: '1' });

    await openSupplierSelect(user);
    await user.click(screen.getByRole('option', { name: /all suppliers/i }));

    expect(mockSetSupplierId).toHaveBeenCalledWith(null);
  });

  it.each([
    { belowMinOnly: false, expectedChecked: false },
    { belowMinOnly: true, expectedChecked: true },
  ])('projects belowMinOnly (belowMinOnly=$belowMinOnly)', ({ belowMinOnly, expectedChecked }) => {
    setup({ belowMinOnly });
    const checkbox = screen.getByRole('checkbox', { name: /below minimum quantity only/i });
    if (expectedChecked) {
      expect(checkbox).toBeChecked();
    } else {
      expect(checkbox).not.toBeChecked();
    }
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
