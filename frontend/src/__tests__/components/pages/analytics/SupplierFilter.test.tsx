/**
 * @file SupplierFilter.test.tsx
 * @module __tests__/components/pages/analytics/components/filters/SupplierFilter
 * @description
 * Enterprise tests for SupplierFilter (MUI Select):
 * - Renders the dropdown and options (including "All suppliers")
 * - Reflects current selection via `value.supplierId`
 * - Emits `onChange` with updated supplierId (or undefined for "All suppliers")
 * - Honors disabled state
 * - Handles empty supplier lists safely
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SupplierRef } from '@/api/analytics/types';
import type { AnalyticsFilters } from '@/pages/analytics/components/filters/Filters.types';
import { SupplierFilter } from '@/pages/analytics/components/filters/SupplierFilter';
import { tEn } from '../../../test/i18nEn';

// B2 (CM-APP24): provide a react-i18next mock so useTranslation resolves without an
// i18n instance in this suite, silencing the NO_I18NEXT_INSTANCE warning. The stub
// mirrors react-i18next's no-instance fallback exactly — it returns an explicit string
// fallback / options.defaultValue when supplied, otherwise the key — so rendered text
// (and therefore every assertion) is unchanged.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
    i18n: { language: 'en' },
  }),
}));

// -----------------------------------------------------------------------------
// Test data
// -----------------------------------------------------------------------------

const suppliers: SupplierRef[] = [
  { id: 'sup-1', name: 'Supplier A' },
  { id: 'sup-2', name: 'Supplier B' },
  { id: 'sup-3', name: 'Supplier C' },
];

const baseValue: AnalyticsFilters = {
  from: '2025-01-01',
  to: '2025-12-31',
  supplierId: undefined,
  quick: '180',
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Opens the MUI Select and returns its listbox (options render in a portal). */
async function openSelect(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('combobox'));
  return screen.getByRole('listbox');
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('SupplierFilter', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a supplier dropdown', () => {
    render(<SupplierFilter value={baseValue} suppliers={suppliers} onChange={onChange} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders "All suppliers" plus all supplier options when opened', async () => {
    const user = userEvent.setup();
    render(<SupplierFilter value={baseValue} suppliers={suppliers} onChange={onChange} />);

    const listbox = await openSelect(user);
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(suppliers.length + 1);

    expect(within(listbox).getByRole('option', { name: /all suppliers/i })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Supplier A' })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Supplier B' })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Supplier C' })).toBeInTheDocument();
  });

  it('reflects the selected supplier from props', () => {
    render(
      <SupplierFilter
        value={{ ...baseValue, supplierId: 'sup-2' }}
        suppliers={suppliers}
        onChange={onChange}
      />,
    );

    // MUI Select renders the selected option's label in the combobox trigger.
    expect(screen.getByRole('combobox')).toHaveTextContent('Supplier B');
  });

  it('emits onChange with the selected supplierId', async () => {
    const user = userEvent.setup();
    render(<SupplierFilter value={baseValue} suppliers={suppliers} onChange={onChange} />);

    const listbox = await openSelect(user);
    await user.click(within(listbox).getByRole('option', { name: 'Supplier A' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ supplierId: 'sup-1' }));
  });

  it('emits onChange with supplierId=undefined when "All suppliers" is selected', async () => {
    const user = userEvent.setup();
    render(
      <SupplierFilter
        value={{ ...baseValue, supplierId: 'sup-1' }}
        suppliers={suppliers}
        onChange={onChange}
      />,
    );

    const listbox = await openSelect(user);
    await user.click(within(listbox).getByRole('option', { name: /all suppliers/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ supplierId: undefined }));
  });

  it('disables the dropdown when disabled', () => {
    render(<SupplierFilter value={baseValue} suppliers={suppliers} onChange={onChange} disabled />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-disabled', 'true');
  });

  it('handles an empty suppliers list', async () => {
    const user = userEvent.setup();
    render(<SupplierFilter value={baseValue} suppliers={[]} onChange={onChange} />);

    const listbox = await openSelect(user);
    expect(within(listbox).getAllByRole('option')).toHaveLength(1);
    expect(within(listbox).getByRole('option', { name: /all suppliers/i })).toBeInTheDocument();
  });
});
