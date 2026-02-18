/**
 * @file fixtures.ts
 * @module __tests__/components/pages/inventory/QuantityAdjustDialog/fixtures
 * @description Shared test fixtures for QuantityAdjustDialog tests.
 * Centralizes stable options and state factories to reduce duplication.
 *
 * Out of scope:
 * - Production logic re-implementation (keep fixtures minimal).
 */

import { vi } from 'vitest';

import type { SupplierOption, ItemOption } from '../../../../../api/analytics/types';
import type { UseQuantityAdjustFormReturn } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustForm';

export const supplierOption: SupplierOption = { id: 'sup-1', label: 'Supplier One' };

export const itemOption: ItemOption = {
  id: 'item-1',
  name: 'Item One',
  onHand: 5,
  price: 9.99,
};

export const makeQuantityAdjustForm = (
  overrides: Partial<UseQuantityAdjustFormReturn> = {}
): UseQuantityAdjustFormReturn => ({
  // Provide the minimal shape required by QuantityAdjustDialog/QuantityAdjustForm contracts.
  selectedSupplier: null,
  selectedItem: null,
  itemQuery: '',
  formError: '',
  setSelectedSupplier: vi.fn(),
  setSelectedItem: vi.fn(),
  setItemQuery: vi.fn(),
  setFormError: vi.fn(),
  suppliers: [],
  suppliersLoading: false,
  items: [],
  itemsLoading: false,
  effectiveCurrentQty: 0,
  effectiveCurrentPrice: null,
  itemDetailsLoading: false,
  control: {} as UseQuantityAdjustFormReturn['control'],
  formState: { errors: {}, isSubmitting: false } as UseQuantityAdjustFormReturn['formState'],
  setValue: vi.fn(),
  onSubmit: vi.fn(),
  handleClose: vi.fn(),
  ...overrides,
});
