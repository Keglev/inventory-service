/**
 * @file QuantityAdjustItemDetails.test.tsx
 *
 * @what_is_under_test QuantityAdjustItemDetails component
 * @responsibility Display selected item details with loading and fallback logic
 * @out_of_scope Query hooks, dialog orchestration
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuantityAdjustItemDetails } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustItemDetails';
import type { ItemOption } from '../../../../../api/analytics/types';

const item: ItemOption = {
  id: 'item-9',
  name: 'Hand Sanitizer',
  supplierId: 'sup-3',
  onHand: 25,
  price: 7.5,
};

describe('QuantityAdjustItemDetails', () => {
  it('returns null when no item selected', () => {
    const { container } = render(
      <QuantityAdjustItemDetails item={null} currentQty={0} currentPrice={null} loading={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders item information when selection exists', () => {
    render(
      <QuantityAdjustItemDetails item={item} currentQty={30} currentPrice={8.25} loading={false} />
    );

    expect(screen.getByText('Selected Item: Hand Sanitizer')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('$8.25')).toBeInTheDocument();
  });

  it('shows spinners while loading details', () => {
    render(
      <QuantityAdjustItemDetails item={item} currentQty={0} currentPrice={null} loading={true} />
    );

    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
  });

  it('falls back to item price when current price absent', () => {
    render(
      <QuantityAdjustItemDetails item={item} currentQty={25} currentPrice={null} loading={false} />
    );

    expect(screen.getByText('$7.50')).toBeInTheDocument();
  });
});
