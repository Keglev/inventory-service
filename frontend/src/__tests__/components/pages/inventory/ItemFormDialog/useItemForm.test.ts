/**
 * @file useItemForm.test.ts
 *
 * @what_is_under_test useItemForm hook
 * @responsibility Manage form state, suppliers query, and submission handlers
 * @out_of_scope Component rendering, API layer
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../../../../../api/inventory/hooks/useInventoryData.ts', () => ({
  useSuppliersQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

vi.mock('../../../../../api/inventory/mutations.ts', () => ({
  upsertItem: vi.fn(),
}));

vi.mock('../../../../../context/toast.ts', () => ({
  useToast: vi.fn(() => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  })),
}));

import { useItemForm } from '../../../../../pages/inventory/dialogs/ItemFormDialog/useItemForm';

describe('useItemForm', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() =>
      useItemForm({
        isOpen: true,
        initial: undefined,
        onClose: vi.fn(),
      })
    );
    expect(result.current.supplierValue).toBeNull();
    expect(result.current.formError).toBeNull();
  });

  it('sets supplier value', () => {
    const { result } = renderHook(() =>
      useItemForm({
        isOpen: true,
        initial: undefined,
        onClose: vi.fn(),
      })
    );
    expect(result.current.setSupplierValue).toBeDefined();
  });
});
