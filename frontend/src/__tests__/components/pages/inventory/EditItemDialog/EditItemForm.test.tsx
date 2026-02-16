/**
 * @file useEditItemForm.test.ts
 * @module __tests__/components/pages/inventory/EditItemDialog/useEditItemForm
 * @description Unit tests for useEditItemForm (state orchestration + query wiring + submit workflow).
 *
 * Contract under test:
 * - Wires inventory queries with correct arguments (dialogOpen, selectedSupplier, itemQuery, selectedItemId).
 * - Changing supplier resets dependent state (selectedItem, itemQuery, formError).
 * - handleClose resets state, resets react-hook-form, and calls onClose.
 * - onSubmit (RHF handler) validates prerequisites and triggers renameItem workflow:
 *   - blocks when no item selected
 *   - calls renameItem on success and triggers toast + onItemRenamed + onClose
 *   - surfaces an error when API returns ok:false
 *
 * Out of scope:
 * - UI rendering (EditItemForm)
 * - React Query caching/transport
 * - Zod schema correctness and RHF internals beyond our boundary interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import { useEditItemForm } from '../../../../../pages/inventory/dialogs/EditItemDialog/useEditItemForm';
import { renameItem } from '../../../../../api/inventory/mutations';
import {
  useSuppliersQuery,
  useItemSearchQuery,
  useItemDetailsQuery,
} from '../../../../../api/inventory/hooks/useInventoryData';

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
const toastSpy = vi.hoisted(() => vi.fn());
const tSpy = vi.hoisted(() => vi.fn((key: string, defaultValue?: string) => defaultValue ?? key));

vi.mock('../../../../../api/inventory/mutations', () => ({
  renameItem: vi.fn(),
}));

vi.mock('../../../../../api/inventory/hooks/useInventoryData', () => ({
  useSuppliersQuery: vi.fn(),
  useItemSearchQuery: vi.fn(),
  useItemDetailsQuery: vi.fn(),
}));

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

  describe('dependent state resets', () => {
    it('clears selected item, itemQuery, and formError when supplier changes', () => {
      const { result } = render(true);

      act(() => {
        result.current.setSelectedItem({ id: 'item-1', name: 'Item 1' });
        result.current.setItemQuery('search');
        result.current.setFormError('Error');
      });

      expect(result.current.selectedItem).not.toBeNull();
      expect(result.current.itemQuery).toBe('search');
      expect(result.current.formError).toBe('Error');

      act(() => {
        result.current.setSelectedSupplier({ id: 'sup-1', label: 'Supplier A' });
      });

      expect(result.current.selectedItem).toBeNull();
      expect(result.current.itemQuery).toBe('');
      expect(result.current.formError).toBe('');
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

      expect(renameItemMock).toHaveBeenCalled();
      expect(toastSpy).toHaveBeenCalled();
      expect(onItemRenamed).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
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
