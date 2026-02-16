/**
 * @file useEditItemForm.test.ts
 *
 * @what_is_under_test useEditItemForm hook - state and query orchestration
 * @responsibility Manage form state, queries, submission, cleanup, error handling
 * @out_of_scope UI rendering, dialog lifecycle, component composition
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import { useEditItemForm } from '../../../../../pages/inventory/dialogs/EditItemDialog/useEditItemForm';
import {
  useSuppliersQuery,
  useItemSearchQuery,
  useItemDetailsQuery,
} from '../../../../../api/inventory/hooks/useInventoryData';
import { renameItem } from '../../../../../api/inventory/mutations';

// Mock dependencies
vi.mock('../../../../../api/inventory/mutations', () => ({
  renameItem: vi.fn(),
}));

vi.mock('../../../../../api/inventory/hooks/useInventoryData', () => ({
  useSuppliersQuery: vi.fn(),
  useItemSearchQuery: vi.fn(),
  useItemDetailsQuery: vi.fn(),
}));

const toastSpy = vi.hoisted(() => vi.fn());
const tSpy = vi.hoisted(() => vi.fn((key: string, fallback?: string) => fallback ?? key));

vi.mock('../../../../../context/toast', () => ({
  useToast: () => toastSpy,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: tSpy }),
}));

/**
 * React Query helper:
 * UseQueryResult is a union with many required fields; tests only need a stable minimal object
 * that still satisfies the type system.
 */

function createQueryResult<T>(
  data: T,
  overrides: Partial<UseQueryResult<T, Error>> = {},
): UseQueryResult<T, Error> {
  const base = {
    data,
    error: null,
    isError: false,
    isFetching: false,
    isLoading: false,
    isPending: false,
    isSuccess: true,
    status: 'success',
    fetchStatus: 'idle',
    refetch: vi.fn(),
  };

  // React Query's UseQueryResult is a union whose members differ between versions.
  // For deterministic unit tests we only need a small stable subset; cast via unknown
  // to avoid coupling tests to version-specific union fields.
  return ({ ...base, ...overrides } as unknown) as UseQueryResult<T, Error>;
}

/**
 * RHF mock: we need handleSubmit(fn) to return a submit handler that calls fn(formData).
 * This matches how your hook exposes `onSubmit`.
 */
const resetSpy = vi.hoisted(() => vi.fn());
const setValueSpy = vi.hoisted(() => vi.fn());

// Controlled per-test form data injected into handleSubmit().
let formData: unknown = { newName: 'New Name' };

vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual<typeof import('react-hook-form')>('react-hook-form');
  return {
    ...actual,
    useForm: () => ({
      control: {},
      handleSubmit: (onValid: (data: unknown) => unknown) => {
        return async () => {
          await onValid(formData);
        };
      },
      formState: { errors: {}, isSubmitting: false },
      reset: resetSpy,
      setValue: setValueSpy,
    }),
  };
});

// Typed handles for mocks
const useSuppliersQueryMock = vi.mocked(useSuppliersQuery);
const useItemSearchQueryMock = vi.mocked(useItemSearchQuery);
const useItemDetailsQueryMock = vi.mocked(useItemDetailsQuery);
const renameItemMock = vi.mocked(renameItem);

describe('useEditItemForm', () => {
  const onClose = vi.fn();
  const onItemRenamed = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    formData = { newName: 'New Name' };
    resetSpy.mockReset();
    setValueSpy.mockReset();
    toastSpy.mockReset();
    tSpy.mockClear();

    // Use fully-typed query results to satisfy UseQueryResult union type.
    useSuppliersQueryMock.mockReturnValue(
      createQueryResult([]) as ReturnType<typeof useSuppliersQuery>,
    );
    useItemSearchQueryMock.mockReturnValue(
      createQueryResult([]) as ReturnType<typeof useItemSearchQuery>,
    );
    useItemDetailsQueryMock.mockReturnValue(
      createQueryResult(null) as ReturnType<typeof useItemDetailsQuery>,
    );

    // IMPORTANT: use mockReturnValue (not mockResolvedValue) to avoid Promise-vs-value typing issues.
    renameItemMock.mockReturnValue({ ok: true } as unknown as ReturnType<typeof renameItem>);
  });

  function render(open = true) {
    return renderHook(() => useEditItemForm(open, onClose, onItemRenamed));
  }

  describe('query wiring', () => {
    it('wires suppliers/items/details queries with correct arguments', () => {
      const { result } = render(true);

      expect(useSuppliersQueryMock).toHaveBeenCalledWith(true);
      expect(useItemSearchQueryMock).toHaveBeenCalledWith(null, '');
      expect(useItemDetailsQueryMock).toHaveBeenCalledWith(undefined);

      act(() => {
        result.current.setSelectedSupplier({ id: 'sup-1', label: 'Supplier A' });
      });

      act(() => {
        result.current.setItemQuery('gl');
      });

      act(() => {
        result.current.setSelectedItem({ id: 'item-1', name: 'Gloves' });
      });

      expect(useItemSearchQueryMock).toHaveBeenLastCalledWith(
        { id: 'sup-1', label: 'Supplier A' },
        'gl',
      );
      expect(useItemDetailsQueryMock).toHaveBeenLastCalledWith('item-1');
    });

    it('passes dialogOpen=false to suppliers query when closed', () => {
      render(false);
      expect(useSuppliersQueryMock).toHaveBeenCalledWith(false);
    });
  });

  describe('form effects', () => {
    it('prefills form fields when selectedItem changes', () => {
      const { result } = render(true);

      act(() => {
        result.current.setSelectedItem({ id: 'item-1', name: 'Fallback Name' });
      });

      expect(setValueSpy).toHaveBeenCalledWith('itemId', 'item-1');
      expect(setValueSpy).toHaveBeenCalledWith('newName', 'Fallback Name');

      setValueSpy.mockClear();

      useItemDetailsQueryMock.mockReturnValue(
        createQueryResult({ name: 'Canonical Name' }) as ReturnType<typeof useItemDetailsQuery>,
      );

      act(() => {
        result.current.setSelectedItem({ id: 'item-2', name: 'Other Name' });
      });

      expect(setValueSpy).toHaveBeenCalledWith('itemId', 'item-2');
      expect(setValueSpy).toHaveBeenCalledWith('newName', 'Canonical Name');
    });
  });

  describe('handleClose', () => {
    it('resets state, resets form, and calls onClose', () => {
      const { result } = render(true);

      act(() => {
        result.current.setSelectedSupplier({ id: 'sup-1', label: 'Supplier A' });
        result.current.setSelectedItem({ id: 'item-1', name: 'Item 1' });
        result.current.setItemQuery('search');
        result.current.setFormError('Error');
      });

      act(() => {
        result.current.handleClose();
      });

      expect(result.current.selectedSupplier).toBeNull();
      expect(result.current.selectedItem).toBeNull();
      expect(result.current.itemQuery).toBe('');
      expect(result.current.formError).toBe('');

      expect(resetSpy).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('submit workflow', () => {
    it('blocks submit when no item is selected (sets formError, does not call renameItem)', async () => {
      const { result } = render(true);

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(renameItemMock).not.toHaveBeenCalled();
      expect(result.current.formError).toBeTruthy();
    });

    it('calls renameItem and triggers success effects', async () => {
      const { result } = render(true);

      act(() => {
        result.current.setSelectedSupplier({ id: 'sup-1', label: 'Supplier A' });
      });

      act(() => {
        result.current.setSelectedItem({ id: 'item-1', name: 'Old Name' });
      });

      formData = { itemId: 'item-1', newName: 'New Name' };

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(renameItemMock).toHaveBeenCalledWith({ id: 'item-1', newName: 'New Name' });
      expect(toastSpy).toHaveBeenCalled();
      expect(onItemRenamed).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(resetSpy).toHaveBeenCalled();
    });

    it('surfaces an error when API returns ok:false', async () => {
      renameItemMock.mockReturnValue(
        { ok: false, error: 'Conflict' } as unknown as ReturnType<typeof renameItem>,
      );

      const { result } = render(true);

      act(() => {
        result.current.setSelectedSupplier({ id: 'sup-1', label: 'Supplier A' });
      });

      act(() => {
        result.current.setSelectedItem({ id: 'item-1', name: 'Old Name' });
      });

      formData = { itemId: 'item-1', newName: 'New Name' };

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(onItemRenamed).not.toHaveBeenCalled();
      expect(result.current.formError).toBeTruthy();
    });
  });
});
