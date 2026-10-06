/**
 * @file SelectedItemDetails.test.tsx
 * @module __tests__/components/pages/inventory/SelectedItemDetails
 * @description Contract tests for SelectedItemDetails, the item panel shared by
 * the price-change and quantity-adjust dialogs:
 * - Renders nothing when no item is selected.
 * - Shows name, quantity and price, quantity first, price in the user's number
 *   format with a Euro suffix.
 * - Adds the total value (price x quantity) only when asked.
 * - Shows spinners while loading; falls back to the item's price.
 *
 * Out of scope:
 * - Query orchestration (supplied by the dialogs' hooks).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SelectedItemDetails } from '../../../../pages/inventory/dialogs/SelectedItemDetails';
import type { ItemOption } from '../../../../api/analytics/types';
import { makeTEn } from '../../../test/i18nEn';

const tEn = makeTEn(['inventory', 'common']);
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => tEn(key, options) }),
}));

// German number format: the price-change panel once printed "4.85" in the German UI.
vi.mock('../../../../hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: { numberFormat: 'DE', dateFormat: 'DD.MM.YYYY', tableDensity: 'standard' },
  }),
}));

const item: ItemOption = { id: 'item-9', name: 'Ball Bearing', supplierId: 'sup-3', onHand: 25, price: 7.5 };

describe('SelectedItemDetails', () => {
  it('renders nothing when no item is selected', () => {
    const { container } = render(
      <SelectedItemDetails item={null} currentQty={0} currentPrice={null} loading={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows quantity then price, formatted, and no total by default', () => {
    render(<SelectedItemDetails item={item} currentQty={120} currentPrice={4.85} loading={false} />);

    expect(screen.getByText('Selected Item: Ball Bearing')).toBeInTheDocument();
    const values = screen.getAllByText(/^(120|4,85 €)$/).map((el) => el.textContent);
    expect(values).toEqual(['120', '4,85 €']);
    expect(screen.queryByText(/Current Total Value/)).not.toBeInTheDocument();
  });

  it('adds the total value when showTotal is set', () => {
    render(<SelectedItemDetails item={item} currentQty={120} currentPrice={4.85} loading={false} showTotal />);

    expect(screen.getByText('Current Total Value:')).toBeInTheDocument();
    expect(screen.getByText('582,00 €')).toBeInTheDocument();
  });

  it('shows a spinner for each value while loading', () => {
    render(<SelectedItemDetails item={item} currentQty={0} currentPrice={null} loading showTotal />);
    expect(screen.getAllByRole('progressbar')).toHaveLength(3);
  });

  it("falls back to the item's price when the current price is missing", () => {
    render(<SelectedItemDetails item={item} currentQty={25} currentPrice={null} loading={false} />);
    expect(screen.getByText('7,50 €')).toBeInTheDocument();
  });
});
