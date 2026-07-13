/**
 * @file PriceChangeItemDetails.test.tsx
 * @module __tests__/components/pages/inventory/PriceChangeDialog/PriceChangeItemDetails
 * @description Reference panel above the new-price input.
 *
 * Contract under test:
 * - Renders nothing when no item is selected.
 * - Shows name, current price (2 decimals), quantity, and computed total.
 * - Shows spinners instead of numbers while the details query loads.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PriceChangeItemDetails } from '../../../../../pages/inventory/dialogs/PriceChangeDialog/PriceChangeItemDetails';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const item = { id: 'it-1', name: 'Blue Widget' };

describe('PriceChangeItemDetails', () => {
  it('renders nothing when no item is selected', () => {
    const { container } = render(
      <PriceChangeItemDetails item={null} currentPrice={5} currentQty={3} loading={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders name, price, quantity, and total value when loaded', () => {
    render(
      <PriceChangeItemDetails item={item} currentPrice={2.5} currentQty={4} loading={false} />
    );

    expect(screen.getByText(/Blue Widget/)).toBeInTheDocument();
    // Price with two decimals and total = price x quantity.
    expect(screen.getByText('2.50')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('10.00')).toBeInTheDocument();
    expect(screen.getByText(/inventory:price\.currentPrice/)).toBeInTheDocument();
    expect(screen.getByText(/inventory:quantity\.currentQuantity/)).toBeInTheDocument();
    expect(screen.getByText(/inventory:price\.currentTotalValue/)).toBeInTheDocument();
  });

  it('shows progress indicators instead of numbers while loading', () => {
    render(
      <PriceChangeItemDetails item={item} currentPrice={2.5} currentQty={4} loading={true} />
    );

    // One spinner per numeric cell: price, quantity, total.
    expect(screen.getAllByRole('progressbar')).toHaveLength(3);
    expect(screen.queryByText('2.50')).not.toBeInTheDocument();
    expect(screen.queryByText('10.00')).not.toBeInTheDocument();
  });
});
