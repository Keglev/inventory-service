/**
 * @file useItemForm.test.ts
 * @module __tests__/components/pages/inventory/ItemFormDialog/useItemForm
 * @description Contract tests for useItemForm (dialog hook):
 * - Initializes deterministic default state for create flow.
 * - Wires suppliers query based on dialog open state.
 * - Exposes setter functions required by the form UI.
 *
 * Out of scope:
 * - RHF validation schema and resolver behavior
 * - Mutation workflow details (covered by integration tests at dialog level)
 * - Component rendering (ItemForm / ItemFormDialog)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useItemForm } from '../../../../../pages/inventory/dialogs/ItemFormDialog/useItemForm';

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
/**
 * Hoisted mocks ensure deterministic module initialization.
 */
const mockUseSuppliersQuery = vi.hoisted(() =>
  vi.fn(() => ({ isLoading: false, data: [] }))
);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue ?? key,
  }),
}));

vi.mock('../../../../../api/inventory/hooks/useInventoryData', () => ({
  useSuppliersQuery: mockUseSuppliersQuery,
}));

vi.mock('../../../../../api/inventory/mutations', () => ({
  upsertItem: vi.fn(),
}));

vi.mock('../../../../../context/toast', () => ({
  useToast: () => vi.fn(),
}));

describe('useItemForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSuppliersQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
  });

  it('initializes with default state for create flow', () => {
    const { result } = renderHook(() =>
      useItemForm({
        isOpen: true,
        initial: undefined,
        onClose: vi.fn(),
        onSaved: vi.fn(),
      }),
    );

    expect(result.current.supplierValue).toBeNull();
    expect(result.current.formError).toBeNull();

    // UI contract: setters exist
    expect(typeof result.current.setSupplierValue).toBe('function');
    expect(typeof result.current.setFormError).toBe('function');
  });

  it('wires suppliers query to dialog open state', () => {
    const { rerender } = renderHook(
      ({ isOpen }: { isOpen: boolean }) => useItemForm({ isOpen, onClose: vi.fn() }),
      { initialProps: { isOpen: false } }
    );

    expect(mockUseSuppliersQuery).toHaveBeenCalledWith(false);

    rerender({ isOpen: true });

    expect(mockUseSuppliersQuery).toHaveBeenCalledWith(true);
  });
});
