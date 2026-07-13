/**
 * @file useQuantityAdjustForm.test.ts
 * @module __tests__/components/pages/inventory/QuantityAdjustDialog/useQuantityAdjustForm
 * @description Orchestrator hook for the quantity-adjust flow, exercised
 * with the real react-hook-form instance, real state hook, and the real
 * useQuantityAdjustFormQueries composition (api hooks mocked at the boundary).
 *
 * Contract under test:
 * - Effective quantity/price fallback chains (details -> search result ->
 *   0/null; price prefers the analytics price query).
 * - Item-pick effect mirrors itemId and pre-fills new/current quantity
 *   from the live details.
 * - Submit pipeline: delta = newQuantity - effectiveCurrentQty sent to
 *   adjustQuantity with the reason; no-item guard; readOnly demo guard;
 *   errorToken mapping (forbidden / not_found / unprocessable_entity /
 *   other); thrown-transport logging; close + reset on success.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const toastSpy = vi.hoisted(() => vi.fn());

vi.mock('../../../../../api/inventory/stockMutations', () => ({
  adjustQuantity: vi.fn(),
}));

vi.mock('../../../../../api/inventory/hooks/useSuppliersQuery', () => ({
  useSuppliersQuery: vi.fn(),
}));

vi.mock('../../../../../api/inventory/hooks/useItemSearchQuery', () => ({
  useItemSearchQuery: vi.fn(),
}));

vi.mock('../../../../../api/inventory/hooks/useItemDetailsQuery', () => ({
  useItemDetailsQuery: vi.fn(),
}));

vi.mock(
  '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useItemPriceQuery',
  () => ({
    useItemPriceQuery: vi.fn(),
  })
);

vi.mock('../../../../../context/toast/ToastContext', () => ({
  useToast: () => toastSpy,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../../../utils/logger', () => ({
  logError: vi.fn(),
}));

import { useQuantityAdjustForm } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustForm';
import { adjustQuantity } from '../../../../../api/inventory/stockMutations';
import { useSuppliersQuery } from '../../../../../api/inventory/hooks/useSuppliersQuery';
import { useItemSearchQuery } from '../../../../../api/inventory/hooks/useItemSearchQuery';
import { useItemDetailsQuery } from '../../../../../api/inventory/hooks/useItemDetailsQuery';
import { useItemPriceQuery } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useItemPriceQuery';
import { logError } from '../../../../../utils/logger';
import type { ItemOption } from '../../../../../api/analytics/types';

const adjustQuantityMock = vi.mocked(adjustQuantity);
const useSuppliersQueryMock = vi.mocked(useSuppliersQuery);
const useItemSearchQueryMock = vi.mocked(useItemSearchQuery);
const useItemDetailsQueryMock = vi.mocked(useItemDetailsQuery);
const useItemPriceQueryMock = vi.mocked(useItemPriceQuery);
const logErrorMock = vi.mocked(logError);

const suppliers = [{ id: 's1', label: 'Alpha' }];
const item: ItemOption = { id: 'it-1', name: 'Widget', price: 3, onHand: 7 } as ItemOption;

function mockQueries({
  details = undefined as { name?: string; onHand: number } | undefined,
  price = null as number | null,
} = {}) {
  useSuppliersQueryMock.mockReturnValue({ data: suppliers, isLoading: false } as never);
  useItemSearchQueryMock.mockReturnValue({ data: [item], isLoading: false } as never);
  useItemDetailsQueryMock.mockReturnValue({ data: details, isLoading: false } as never);
  useItemPriceQueryMock.mockReturnValue({ data: price, isLoading: false } as never);
}

function renderForm(readOnly = false) {
  const onClose = vi.fn();
  const onAdjusted = vi.fn();
  const hook = renderHook(() => useQuantityAdjustForm(true, onClose, onAdjusted, readOnly));
  return { ...hook, onClose, onAdjusted };
}

async function selectItem(hook: ReturnType<typeof renderForm>, target: ItemOption = item) {
  act(() => {
    hook.result.current.setSelectedItem(target);
  });
  await waitFor(() => expect(hook.result.current.selectedItem).toEqual(target));
}

describe('useQuantityAdjustForm', () => {
  beforeEach(() => {
    adjustQuantityMock.mockReset();
    logErrorMock.mockReset();
    toastSpy.mockReset();
    mockQueries();
  });

  it('exposes query pass-through and zeroed effective values without a selection', () => {
    const { result } = renderForm();

    expect(result.current.suppliers).toEqual(suppliers);
    expect(result.current.items).toEqual([item]);
    expect(result.current.effectiveCurrentQty).toBe(0);
    expect(result.current.effectiveCurrentPrice).toBeNull();
  });

  it('prefers the live details quantity and the analytics price once loaded', async () => {
    mockQueries({ details: { onHand: 12 }, price: 9.99 });
    const hook = renderForm();

    await selectItem(hook);

    expect(hook.result.current.effectiveCurrentQty).toBe(12);
    expect(hook.result.current.effectiveCurrentPrice).toBe(9.99);
  });

  it('falls back to search-result values while queries are pending', async () => {
    const hook = renderForm();

    await selectItem(hook);

    expect(hook.result.current.effectiveCurrentQty).toBe(7);
    expect(hook.result.current.effectiveCurrentPrice).toBe(3);
  });

  it('falls back to zero quantity and null price on a bare search result', async () => {
    const bare = { id: 'it-2', name: 'Bare' } as ItemOption;
    const hook = renderForm();

    await selectItem(hook, bare);

    expect(hook.result.current.effectiveCurrentQty).toBe(0);
    expect(hook.result.current.effectiveCurrentPrice).toBeNull();
  });

  it('blocks submission with the no-item message when the selection is gone', async () => {
    const hook = renderForm();

    act(() => {
      hook.result.current.setValue('itemId', 'it-1');
      hook.result.current.setValue('currentQuantity', 7);
      hook.result.current.setValue('newQuantity', 10);
      hook.result.current.setValue('reason', 'MANUAL_UPDATE');
    });
    await act(async () => {
      await hook.result.current.onSubmit();
    });

    expect(hook.result.current.formError).toBe('errors:inventory.selection.noItemSelected');
    expect(adjustQuantityMock).not.toHaveBeenCalled();
  });

  it('blocks submission in read-only demo mode', async () => {
    mockQueries({ details: { onHand: 7 } });
    const hook = renderForm(true);
    await selectItem(hook);

    act(() => {
      hook.result.current.setValue('newQuantity', 10);
    });
    await act(async () => {
      await hook.result.current.onSubmit();
    });

    expect(hook.result.current.formError).toBe('common:demoDisabled');
    expect(adjustQuantityMock).not.toHaveBeenCalled();
  });

  it('computes the delta from the live quantity and closes on success', async () => {
    mockQueries({ details: { onHand: 7 } });
    adjustQuantityMock.mockResolvedValue({ ok: true } as never);
    const hook = renderForm();
    await selectItem(hook);

    act(() => {
      hook.result.current.setValue('newQuantity', 10);
    });
    await act(async () => {
      await hook.result.current.onSubmit();
    });

    expect(adjustQuantityMock).toHaveBeenCalledWith({
      id: 'it-1',
      delta: 3,
      reason: 'MANUAL_UPDATE',
    });
    expect(toastSpy).toHaveBeenCalledWith('inventory:quantity.quantityUpdatedTo', 'success');
    expect(hook.onAdjusted).toHaveBeenCalled();
    expect(hook.onClose).toHaveBeenCalled();
    expect(hook.result.current.selectedItem).toBeNull();
  });

  it.each([
    ['forbidden', 'errors:inventory.businessRules.notAllowed'],
    ['not_found', 'errors:inventory.businessRules.itemNotFound'],
    ['unprocessable_entity', 'errors:inventory.businessRules.stockCannotGoNegative'],
    ['conflict', 'errors:inventory.requests.failedToAdjustQuantity'],
  ])('maps the %s error token to its message', async (token, message) => {
    mockQueries({ details: { onHand: 7 } });
    adjustQuantityMock.mockResolvedValue({ ok: false, errorToken: token } as never);
    const hook = renderForm();
    await selectItem(hook);

    act(() => {
      hook.result.current.setValue('newQuantity', 10);
    });
    await act(async () => {
      await hook.result.current.onSubmit();
    });

    expect(hook.result.current.formError).toBe(message);
    expect(hook.onClose).not.toHaveBeenCalled();
  });

  it('logs thrown transport errors and shows the generic message', async () => {
    mockQueries({ details: { onHand: 7 } });
    adjustQuantityMock.mockRejectedValue(new Error('boom'));
    const hook = renderForm();
    await selectItem(hook);

    act(() => {
      hook.result.current.setValue('newQuantity', 10);
    });
    await act(async () => {
      await hook.result.current.onSubmit();
    });

    expect(logErrorMock).toHaveBeenCalledWith(
      'Quantity adjustment error:',
      expect.any(Error)
    );
    expect(hook.result.current.formError).toBe(
      'errors:inventory.requests.failedToAdjustQuantity'
    );
  });

  it('handleClose resets selection state and calls onClose', async () => {
    const hook = renderForm();
    await selectItem(hook);

    act(() => {
      hook.result.current.handleClose();
    });

    expect(hook.result.current.selectedItem).toBeNull();
    expect(hook.result.current.itemQuery).toBe('');
    expect(hook.result.current.formError).toBe('');
    expect(hook.onClose).toHaveBeenCalled();
  });
});
