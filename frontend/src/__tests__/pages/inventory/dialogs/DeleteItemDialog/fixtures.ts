/**
 * @file fixtures.ts
 * @module __tests__/pages/inventory/dialogs/DeleteItemDialog/fixtures
 * @description Shared fixture (fork 4 A, 2026-10-22): the delete dialog's
 * state contract with every field neutral and every callback a fresh spy.
 * Consumers: DeleteItemContent.test.tsx, DeleteItemDialog.test.tsx.
 */
import { vi } from 'vitest';

import type { UseDeleteItemDialogReturn } from '@/pages/inventory/dialogs/DeleteItemDialog/DeleteItemDialog.types';

export function createMockState(
  overrides: Partial<UseDeleteItemDialogReturn> = {},
): UseDeleteItemDialogReturn {
  const base: UseDeleteItemDialogReturn = {
    selectedSupplier: null,
    selectedItem: null,
    formError: '',
    itemQuery: '',
    showConfirmation: false,
    isSubmitting: false,
    suppliersQuery: ({ data: [], isLoading: false } as unknown) as UseDeleteItemDialogReturn['suppliersQuery'],
    itemsQuery: ({ data: [], isLoading: false } as unknown) as UseDeleteItemDialogReturn['itemsQuery'],
    itemDetailsQuery: ({ data: null, isLoading: false } as unknown) as UseDeleteItemDialogReturn['itemDetailsQuery'],
    setItemQuery: vi.fn(),
    setSelectedSupplier: vi.fn(),
    setSelectedItem: vi.fn(),
    setFormError: vi.fn(),
    setShowConfirmation: vi.fn(),
    handleClose: vi.fn(),
    handleCancelConfirmation: vi.fn(),
    onSubmit: vi.fn(),
    onConfirmedDelete: vi.fn(),
  };

  return { ...base, ...overrides };
}
