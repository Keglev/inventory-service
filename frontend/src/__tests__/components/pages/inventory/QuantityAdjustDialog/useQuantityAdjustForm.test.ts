/**
 * @file useQuantityAdjustForm.test.ts
 *
 * @what_is_under_test useQuantityAdjustForm hook
 * @responsibility Manage form state, item queries, and submission handlers
 * @out_of_scope Component rendering, API layer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import * as inventoryHooksModule from '../../../../../api/inventory/hooks/useInventoryData';

// Mock dependencies - must be before import
vi.mock('../../../../../api/inventory/mutations.ts', () => ({
  adjustQuantity: vi.fn(),
}));

vi.mock('../../../../../api/inventory/hooks/useInventoryData.ts', () => ({
  useSuppliersQuery: vi.fn(),
  useItemSearchQuery: vi.fn(),
  useItemDetailsQuery: vi.fn(),
}));

vi.mock('../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useItemPriceQuery.ts', () => ({
  useItemPriceQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
}));

vi.mock('../../../../../context/toast.ts', () => ({
  useToast: () => vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

vi.mock('react-hook-form', () => {
  const actual = vi.importActual('react-hook-form');
  return {
    ...actual,
    useForm: () => ({
      control: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleSubmit: (fn: any) => fn,
      formState: { errors: {}, isSubmitting: false },
      reset: vi.fn(),
      setValue: vi.fn(),
      register: vi.fn(),
      setError: vi.fn(),
      clearErrors: vi.fn(),
    }),
  };
});

import { useQuantityAdjustForm } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustForm';

describe('useQuantityAdjustForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(inventoryHooksModule.useSuppliersQuery).mockReturnValue({ isLoading: false, data: [] } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(inventoryHooksModule.useItemSearchQuery).mockReturnValue({ isLoading: false, data: [] } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(inventoryHooksModule.useItemDetailsQuery).mockReturnValue({ isLoading: false, data: null } as any);
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() =>
      useQuantityAdjustForm(
        true,
        vi.fn(),
        vi.fn()
      )
    );
    expect(result.current).toBeDefined();
    expect(result.current.selectedItem).toBeNull();
  });

  it('provides form control object', () => {
    const { result } = renderHook(() =>
      useQuantityAdjustForm(
        true,
        vi.fn(),
        vi.fn()
      )
    );
    expect(result.current.control).toBeDefined();
  });
});
