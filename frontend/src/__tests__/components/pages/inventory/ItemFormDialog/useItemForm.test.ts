/**
 * @file useItemForm.test.ts
 * @module __tests__/components/pages/inventory/ItemFormDialog/useItemForm
 * @description Contract tests for useItemForm (dialog hook)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useItemForm } from '../../../../../pages/inventory/dialogs/ItemFormDialog/useItemForm';
import type { UseItemFormReturn } from '../../../../../pages/inventory/dialogs/ItemFormDialog/useItemForm';
import type { SupplierOption } from '../../../../../api/analytics/types';
import type { InventoryRow } from '../../../../../api/inventory/types';
import { tEn } from '../../../../test/i18nEn';

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
/**
 * Hoisted mocks ensure deterministic module initialization.
 */
const mockUseSuppliersQuery = vi.hoisted(() =>
  vi.fn<(enabled: boolean) => { isLoading: boolean; data: SupplierOption[] }>(() => ({
    isLoading: false,
    data: [],
  })),
);

const mockUpsertItem = vi.hoisted(() => vi.fn());
const mockToast = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

vi.mock('../../../../../api/inventory/hooks/useSuppliersQuery', () => ({
  useSuppliersQuery: mockUseSuppliersQuery,
}));

vi.mock('../../../../../api/inventory/itemMutations', () => ({
  upsertItem: mockUpsertItem,
}));

vi.mock('../../../../../context/toast/ToastContext', () => ({
  useToast: () => mockToast,
}));

type HookArgs = Parameters<typeof useItemForm>[0];

function renderUseItemForm(overrides: Partial<HookArgs> = {}) {
  const args: HookArgs = {
    isOpen: true,
    onClose: vi.fn(),
    ...overrides,
  };

  return {
    args,
    ...renderHook(() => useItemForm(args)),
  };
}

async function makeFormValid(result: { current: unknown }) {
  // itemFormSchema requires: name, code, supplierId (!'' and != 0), quantity >= 0, price >= 0, reason enum.
  const current = result.current as UseItemFormReturn;

  act(() => {
    current.setValue('name', 'Test Item', { shouldValidate: true });
    current.setValue('code', 'SKU-TST-1', { shouldValidate: true });
    current.setValue('supplierId', 'sup-1', { shouldValidate: true });
    current.setValue('quantity', 1, { shouldValidate: true });
    current.setValue('price', 1, { shouldValidate: true });
    current.setValue('reason', 'INITIAL_STOCK', { shouldValidate: true });
  });

  await waitFor(() => {
    expect((result.current as UseItemFormReturn).formState.errors).toBeDefined();
  });
}

async function submitValid(result: { current: unknown }) {
  await makeFormValid(result);
  await act(async () => {
    await (result.current as UseItemFormReturn).onSubmit();
  });
}

describe('useItemForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsertItem.mockReset();
    mockToast.mockReset();
    mockUseSuppliersQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
  });

  it('initializes with default state for create flow', () => {
    const { result } = renderUseItemForm({ initial: undefined, onSaved: vi.fn() });

    expect(result.current.supplierValue).toBeNull();
    expect(result.current.formError).toBeNull();

    // UI contract: setters exist
    expect(typeof result.current.setSupplierValue).toBe('function');
    expect(typeof result.current.setFormError).toBe('function');
  });

  it('wires suppliers query to dialog open state', () => {
    const { rerender } = renderHook(
      ({ isOpen }: { isOpen: boolean }) => useItemForm({ isOpen, onClose: vi.fn() }),
      { initialProps: { isOpen: false } },
    );

    expect(mockUseSuppliersQuery).toHaveBeenCalledWith(false);

    rerender({ isOpen: true });

    expect(mockUseSuppliersQuery).toHaveBeenCalledWith(true);
  });

  it('aligns supplierValue to initial.supplierId when suppliers load', async () => {
    mockUseSuppliersQuery.mockReturnValue({
      data: [
        { id: 'sup-1', label: 'Supplier A' },
        { id: 'sup-2', label: 'Supplier B' },
      ],
      isLoading: false,
    });

    const initial: InventoryRow = {
      id: 'item-1',
      name: 'Existing',
      code: 'EX-1',
      supplierId: 'sup-2',
      onHand: 5,
      minQty: 0,
      createdAt: new Date().toISOString(),
    };

    const { result } = renderUseItemForm({ initial });

    await waitFor(() => {
      expect(result.current.supplierValue).toEqual({ id: 'sup-2', label: 'Supplier B' });
    });
  });

  it('handleClose clears state and calls onClose', () => {
    const onClose = vi.fn();
    const { result } = renderUseItemForm({ onClose, initial: undefined });

    act(() => {
      result.current.setSupplierValue({ id: 'sup-1', label: 'Supplier A' });
      result.current.setFormError('Some error');
    });

    act(() => {
      result.current.handleClose();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(result.current.supplierValue).toBeNull();
    expect(result.current.formError).toBeNull();
  });

  it('onSubmit honors readOnly (demo mode) and does not call upsertItem', async () => {
    const { result } = renderUseItemForm({ readOnly: true });

    await submitValid(result);

    expect(mockUpsertItem).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current.formError).toBe('You are in demo mode and cannot perform this operation.');
    });
  });

  it('onSubmit success path: toasts, calls onSaved, and closes', async () => {
    mockUpsertItem.mockResolvedValue({ ok: true });

    const onClose = vi.fn();
    const onSaved = vi.fn();
    const { result } = renderUseItemForm({ onClose, onSaved });

    await submitValid(result);

    expect(mockUpsertItem).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith('Item successfully saved.', 'success');
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('onSubmit success path works when onSaved is omitted (default no-op)', async () => {
    mockUpsertItem.mockResolvedValue({ ok: true });
    const onClose = vi.fn();
    const { result } = renderUseItemForm({ onClose });
    await submitValid(result);
    expect(mockUpsertItem).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith('Item successfully saved.', 'success');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('maps a conflict token to a name field error', async () => {
    mockUpsertItem.mockResolvedValue({ ok: false, error: 'whatever', errorToken: 'conflict' });

    const { result } = renderUseItemForm();
    await submitValid(result);

    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.current.formState.errors as any).name?.message).toBe('An item with this name already exists');
    });
  });

  it('maps backend fieldErrors to form fields (sku maps to code)', async () => {
    mockUpsertItem.mockResolvedValue({
      ok: false,
      error: 'whatever',
      errorToken: 'conflict',
      fieldErrors: { sku: 'Another inventory item with this SKU already exists.' },
    });

    const { result } = renderUseItemForm();
    await submitValid(result);

    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.current.formState.errors as any).code?.message)
        .toBe('Another inventory item with this SKU already exists.');
    });
    // token fallback must NOT also fire when a field error was applied
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result.current.formState.errors as any).name).toBeUndefined();
  });

  it('uses a generic message for a not_found token', async () => {
    mockUpsertItem.mockResolvedValue({ ok: false, error: 'Supplier not found', errorToken: 'not_found' });

    const { result } = renderUseItemForm();
    await submitValid(result);

    await waitFor(() => {
      expect(result.current.formError).toBe('A server error occurred. Please try again.');
    });
  });

  it('uses a generic message for an unmapped failure', async () => {
    mockUpsertItem.mockResolvedValue({ ok: false, error: 'Boom' });

    const { result } = renderUseItemForm();
    await submitValid(result);

    await waitFor(() => {
      expect(result.current.formError).toBe('A server error occurred. Please try again.');
    });
  });
});
