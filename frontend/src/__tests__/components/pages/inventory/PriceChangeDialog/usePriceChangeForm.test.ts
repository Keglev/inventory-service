/**
 * @file usePriceChangeForm.test.ts
 * @module __tests__/pages/inventory/dialogs/PriceChangeDialog/usePriceChangeForm
 * @description
 * Contract tests for usePriceChangeForm hook:
 * - Initializes with default state when opened
 * - Exposes RHF contract surface required by the dialog/form components
 *
 * Notes:
 * - We mock inventory queries and RHF to keep the hook deterministic.
 * - We do not test API implementation details or component rendering here.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import type { UseSuppliersQueryResult, UseItemSearchQueryResult, UseItemDetailsQueryResult } from './usePriceChangeForm.test.types';

/**
 * Hoisted mocks ensure deterministic module initialization.
 */
const mockUseSuppliersQuery = vi.hoisted(() => vi.fn());
const mockUseItemSearchQuery = vi.hoisted(() => vi.fn());
const mockUseItemDetailsQuery = vi.hoisted(() => vi.fn());

vi.mock('../../../../../api/inventory/mutations.ts', () => ({
  changePrice: vi.fn(),
}));

vi.mock('../../../../../api/inventory/hooks/useInventoryData.ts', () => ({
  useSuppliersQuery: mockUseSuppliersQuery,
  useItemSearchQuery: mockUseItemSearchQuery,
  useItemDetailsQuery: mockUseItemDetailsQuery,
}));

vi.mock('../../../../../context/toast.ts', () => ({
  useToast: () => vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue ?? key,
  }),
}));

/**
 * react-hook-form is a dependency; we only need a stable subset for this hook’s contract.
 * handleSubmit(fn) returns a callable submit handler.
 */
vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual<typeof import('react-hook-form')>('react-hook-form');
  return {
    ...actual,
    useForm: () => ({
      control: {},
      handleSubmit: (fn: unknown) => fn as () => void,
      formState: { errors: {}, isSubmitting: false },
      reset: vi.fn(),
      setValue: vi.fn(),
      register: vi.fn(),
      setError: vi.fn(),
      clearErrors: vi.fn(),
    }),
  };
});

import { usePriceChangeForm } from '../../../../../pages/inventory/dialogs/PriceChangeDialog/usePriceChangeForm';

const defaultArgs = () => ({
  isOpen: true,
  onClose: vi.fn(),
  onPriceChanged: vi.fn(),
});

describe('usePriceChangeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const suppliersResult: UseSuppliersQueryResult = { isLoading: false, data: [] };
    const searchResult: UseItemSearchQueryResult = { isLoading: false, data: [] };
    const detailsResult: UseItemDetailsQueryResult = { isLoading: false, data: null };

    mockUseSuppliersQuery.mockReturnValue(suppliersResult);
    mockUseItemSearchQuery.mockReturnValue(searchResult);
    mockUseItemDetailsQuery.mockReturnValue(detailsResult);
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => usePriceChangeForm(defaultArgs()));

    expect(result.current).toBeDefined();
    expect(result.current.selectedItem).toBeNull();
  });

  it('exposes react-hook-form contract surface', () => {
    const { result } = renderHook(() => usePriceChangeForm(defaultArgs()));

    expect(result.current.register).toBeTypeOf('function');
    expect(result.current.handleSubmit).toBeTypeOf('function');
    expect(result.current.formState).toBeDefined();
  });
});
