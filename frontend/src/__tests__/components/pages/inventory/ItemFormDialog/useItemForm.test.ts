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

const mockCreateItem = vi.hoisted(() => vi.fn());
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
  createItem: mockCreateItem,
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
  // itemFormSchema requires: name, code, supplierId (!'' and != 0), quantity >= 1, price > 0.
  const current = result.current as UseItemFormReturn;

  act(() => {
    current.setValue('name', 'Test Item', { shouldValidate: true });
    current.setValue('code', 'SKU-TST-1', { shouldValidate: true });
    current.setValue('supplierId', 'sup-1', { shouldValidate: true });
    current.setValue('quantity', 1, { shouldValidate: true });
    current.setValue('price', 1, { shouldValidate: true });
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
    mockCreateItem.mockReset();
    mockToast.mockReset();
    mockUseSuppliersQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
  });

  it('initializes with default state for create flow', () => {
    const { result } = renderUseItemForm({ onSaved: vi.fn() });

    expect(result.current.supplierValue).toBeNull();
    expect(result.current.formError).toBeNull();
    expect(result.current.watch('quantity')).toBe(1);

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

  it('clears state and calls onClose when handleClose runs', () => {
    const onClose = vi.fn();
    const { result } = renderUseItemForm({ onClose });

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

  it('skips createItem when submitted in read-only demo mode', async () => {
    const { result } = renderUseItemForm({ readOnly: true });

    await submitValid(result);

    expect(mockCreateItem).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current.formError).toBe('You are in demo mode and cannot perform this operation.');
    });
  });

  it('toasts, calls onSaved and closes when a submit succeeds', async () => {
    mockCreateItem.mockResolvedValue({ ok: true });

    const onClose = vi.fn();
    const onSaved = vi.fn();
    const { result } = renderUseItemForm({ onClose, onSaved });

    await submitValid(result);

    expect(mockCreateItem).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith('Item successfully saved.', 'success');
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sends the create request without a low-stock threshold or notes', async () => {
    mockCreateItem.mockResolvedValue({ ok: true });
    const { result } = renderUseItemForm({ onClose: vi.fn() });
    await submitValid(result);
    expect(mockCreateItem).toHaveBeenCalledTimes(1);
    expect(mockCreateItem.mock.calls[0][0]).not.toHaveProperty('minQty');
    expect(mockCreateItem.mock.calls[0][0]).not.toHaveProperty('notes');
  });

  it('succeeds when submitted without an onSaved callback', async () => {
    mockCreateItem.mockResolvedValue({ ok: true });
    const onClose = vi.fn();
    const { result } = renderUseItemForm({ onClose });
    await submitValid(result);
    expect(mockCreateItem).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith('Item successfully saved.', 'success');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('maps a conflict token to a name field error carrying an i18n key', async () => {
    mockCreateItem.mockResolvedValue({ ok: false, error: 'whatever', errorToken: 'conflict' });

    const { result } = renderUseItemForm();
    await submitValid(result);

    // A field error carries a KEY, never display text: the render boundary
    // (utils/fieldErrorText) is what resolves it, so the hook must not translate.
    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.current.formState.errors as any).name?.message)
        .toBe('errors:inventory.conflicts.duplicateName');
    });
  });

  it('maps backend fieldErrors to form fields (sku maps to code) and discards the English message', async () => {
    mockCreateItem.mockResolvedValue({
      ok: false,
      error: 'whatever',
      errorToken: 'conflict',
      fieldErrors: { sku: 'Another inventory item with this SKU already exists.' },
    });

    const { result } = renderUseItemForm();
    await submitValid(result);

    // fieldErrors is a signal (which input), never copy: the server's English
    // sentence must not survive into a German form.
    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.current.formState.errors as any).code?.message)
        .toBe('errors:inventory.conflicts.duplicateSku');
    });
    // token fallback must NOT also fire when a field error was applied
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result.current.formState.errors as any).name).toBeUndefined();
  });

  it('uses a generic message for a not_found token', async () => {
    mockCreateItem.mockResolvedValue({ ok: false, error: 'Supplier not found', errorToken: 'not_found' });

    const { result } = renderUseItemForm();
    await submitValid(result);

    await waitFor(() => {
      expect(result.current.formError).toBe('A server error occurred. Please try again.');
    });
  });

  it('uses a generic message for an unmapped failure', async () => {
    mockCreateItem.mockResolvedValue({ ok: false, error: 'Boom' });

    const { result } = renderUseItemForm();
    await submitValid(result);

    await waitFor(() => {
      expect(result.current.formError).toBe('A server error occurred. Please try again.');
    });
  });
});
