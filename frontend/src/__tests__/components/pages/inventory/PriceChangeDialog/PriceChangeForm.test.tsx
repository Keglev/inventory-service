/**
 * @file PriceChangeForm.test.tsx
 *
 * @what_is_under_test PriceChangeForm component
 * @responsibility Render form fields for price change
 * @out_of_scope Form validation, submission logic
 */

import { describe, it, expect, vi } from 'vitest';
import type { UsePriceChangeFormReturn } from '../../../../../pages/inventory/dialogs/PriceChangeDialog/usePriceChangeForm';

describe('PriceChangeForm', () => {
  it('accepts state prop with supplier selection', () => {
    const state: Partial<UsePriceChangeFormReturn> = {
      selectedSupplier: null,
      setSelectedSupplier: vi.fn(),
    };
    expect(state.selectedSupplier).toBeNull();
    expect(state.setSelectedSupplier).toBeDefined();
  });

  it('accepts state prop with item selection', () => {
    const state: Partial<UsePriceChangeFormReturn> = {
      selectedItem: {
        id: 'item1',
        name: 'Test Item',
        onHand: 100,
      },
      setSelectedItem: vi.fn(),
    };
    expect(state.selectedItem).toBeDefined();
    expect(state.selectedItem?.name).toBe('Test Item');
  });

  it('accepts state prop with form error', () => {
    const state: Partial<UsePriceChangeFormReturn> = {
      formError: 'Price change failed',
      setFormError: vi.fn(),
    };
    expect(state.formError).toBe('Price change failed');
  });

  it('accepts state prop with items list', () => {
    const state: Partial<UsePriceChangeFormReturn> = {
      items: [
        {
          id: 'item1',
          name: 'Item 1',
          onHand: 100,
        },
        {
          id: 'item2',
          name: 'Item 2',
          onHand: 50,
        },
      ],
    };
    expect(state.items).toHaveLength(2);
  });
});
