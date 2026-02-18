/**
 * @file useQuantityAdjustForm.test.ts
 * @module __tests__/components/pages/inventory/QuantityAdjustDialog/useQuantityAdjustForm
 * @description Contract tests for useQuantityAdjustForm (orchestrator hook):
 * - Initializes predictable default state for a new dialog session.
 * - Exposes the minimal RHF surface required by the dialog/components.
 *
 * Out of scope:
 * - API mutation behavior (covered by integration tests).
 * - react-hook-form + Zod schema behavior.
 * - React Query caching/fetching internals.
 */

// Shared deterministic mocks (i18n + toast) for this folder.
import './testSetup';

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// Hoisted mocks guarantee stable module initialization across tests.
const mockUseSuppliersQuery = vi.hoisted(() => vi.fn());
const mockUseItemSearchQuery = vi.hoisted(() => vi.fn());
const mockUseItemDetailsQuery = vi.hoisted(() => vi.fn());

vi.mock('../../../../../api/inventory/hooks/useInventoryData', () => ({
  useSuppliersQuery: mockUseSuppliersQuery,
  useItemSearchQuery: mockUseItemSearchQuery,
  useItemDetailsQuery: mockUseItemDetailsQuery,
}));

vi.mock('../../../../../api/inventory/mutations', () => ({
  adjustQuantity: vi.fn(),
}));

vi.mock('../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useItemPriceQuery', () => ({
  useItemPriceQuery: vi.fn(() => ({ data: null, isLoading: false })),
}));

vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual<typeof import('react-hook-form')>('react-hook-form');
  return {
    ...actual,
    useForm: () => ({
      control: {},
      handleSubmit: (fn: (values: unknown) => unknown) => fn,
      formState: { errors: {}, isSubmitting: false },
      reset: vi.fn(),
      setValue: vi.fn(),
      setError: vi.fn(),
      clearErrors: vi.fn(),
    }),
  };
});

let useQuantityAdjustForm: typeof import('../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustForm').useQuantityAdjustForm;

beforeAll(async () => {
  // Import after mocks are registered so the orchestrator binds to the mocked dependencies.
  ({ useQuantityAdjustForm } = await import(
    '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustForm'
  ));
});

describe('useQuantityAdjustForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseSuppliersQuery.mockReturnValue({ isLoading: false, data: [] });
    mockUseItemSearchQuery.mockReturnValue({ isLoading: false, data: [] });
    mockUseItemDetailsQuery.mockReturnValue({ isLoading: false, data: null });
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useQuantityAdjustForm(true, vi.fn(), vi.fn()));
    expect(result.current).toBeDefined();
    expect(result.current.selectedItem).toBeNull();
  });

  it('provides form control object', () => {
    const { result } = renderHook(() => useQuantityAdjustForm(true, vi.fn(), vi.fn()));
    expect(result.current.control).toBeDefined();
  });
});
