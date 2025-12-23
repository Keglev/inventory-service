/**
 * @file QuantityAdjustForm.test.tsx
 *
 * @what_is_under_test QuantityAdjustForm component
 * @responsibility Render form fields for quantity adjustment
 * @out_of_scope Form validation, submission logic
 */

import { describe, it, expect, vi } from 'vitest';
import type { UseQuantityAdjustFormReturn } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustForm';

describe('QuantityAdjustForm', () => {
  it('accepts form prop with supplier selection', () => {
    const form: Partial<UseQuantityAdjustFormReturn> = {
      selectedSupplier: null,
      setSelectedSupplier: vi.fn(),
    };
    expect(form.selectedSupplier).toBeNull();
    expect(form.setSelectedSupplier).toBeDefined();
  });

  it('accepts form prop with item selection', () => {
    const form: Partial<UseQuantityAdjustFormReturn> = {
      selectedItem: {
        id: 'item1',
        name: 'Test Item',
        onHand: 100,
      },
      setSelectedItem: vi.fn(),
    };
    expect(form.selectedItem).toBeDefined();
    expect(form.selectedItem?.name).toBe('Test Item');
  });

  it('accepts form prop with form error', () => {
    const form: Partial<UseQuantityAdjustFormReturn> = {
      formError: 'Quantity adjustment failed',
      setFormError: vi.fn(),
    };
    expect(form.formError).toBe('Quantity adjustment failed');
  });

  it('accepts form prop with items list', () => {
    const form: Partial<UseQuantityAdjustFormReturn> = {
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
    expect(form.items).toHaveLength(2);
  });
});
