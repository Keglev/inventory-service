/**
 * @file usePriceChangeForm.test.ts
 * @module __tests__/components/pages/inventory/PriceChangeDialog/usePriceChangeForm
 * @description Orchestrator hook for the price-change flow, exercised with
 * the real react-hook-form instance, real state hook, and the real
 * usePriceChangeFormQueries composition (api hooks mocked at the boundary).
 *
 * Contract under test:
 * - Query pass-through and the effective price/quantity fallback chain
 *   (details -> search result -> 0; 0 with no selection).
 * - Item-pick effect mirrors itemId into the form and pre-fills newPrice.
 * - Submit pipeline: no-item guard, readOnly demo guard, success path
 *   (changePrice call, toast, onPriceChanged, close + reset), errorToken
 *   mapping (forbidden / not_found / other), and thrown-transport logging.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const toastSpy = vi.hoisted(() => vi.fn());

vi.mock('../../../../../api/inventory/priceMutations', () => ({
  changePrice: vi.fn(),
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

vi.mock('../../../../../context/toast/ToastContext', () => ({
  useToast: () => toastSpy,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../../../utils/logger', () => ({
  logError: vi.fn(),
}));

import { usePriceChangeForm } from '../../../../../pages/inventory/dialogs/PriceChangeDialog/usePriceChangeForm';
import { changePrice } from '../../../../../api/inventory/priceMutations';
import { useSuppliersQuery } from '../../../../../api/inventory/hooks/useSuppliersQuery';
import { useItemSearchQuery } from '../../../../../api/inventory/hooks/useItemSearchQuery';
import { useItemDetailsQuery } from '../../../../../api/inventory/hooks/useItemDetailsQuery';
import { logError } from '../../../../../utils/logger';
import type { ItemOption } from '../../../../../api/analytics/types';

const changePriceMock = vi.mocked(changePrice);
const useSuppliersQueryMock = vi.mocked(useSuppliersQuery);
const useItemSearchQueryMock = vi.mocked(useItemSearchQuery);
const useItemDetailsQueryMock = vi.mocked(useItemDetailsQuery);
const logErrorMock = vi.mocked(logError);

const suppliers = [{ id: 's1', label: 'Alpha' }];
const item: ItemOption = { id: 'it-1', name: 'Widget', price: 3, onHand: 7 } as ItemOption;

function mockQueries({
  details = undefined as { price?: number; onHand?: number } | undefined,
} = {}) {
  useSuppliersQueryMock.mockReturnValue({ data: suppliers, isLoading: false } as never);
  useItemSearchQueryMock.mockReturnValue({ data: [item], isLoading: false } as never);
  useItemDetailsQueryMock.mockReturnValue({ data: details, isLoading: false } as never);
}

function renderForm(props: Partial<Parameters<typeof usePriceChangeForm>[0]> = {}) {
  const onClose = vi.fn();
  const onPriceChanged = vi.fn();
  const hook = renderHook(() =>
    usePriceChangeForm({ isOpen: true, onClose, onPriceChanged, ...props })
  );
  return { ...hook, onClose, onPriceChanged };
}

/** Selects the item and waits for the pre-fill effect to mirror itemId. */
async function selectItem(hook: ReturnType<typeof renderForm>) {
  act(() => {
    hook.result.current.setSelectedItem(item);
  });
  await waitFor(() => expect(hook.result.current.selectedItem).toEqual(item));
}

describe('usePriceChangeForm', () => {
  beforeEach(() => {
    changePriceMock.mockReset();
    logErrorMock.mockReset();
    toastSpy.mockReset();
    mockQueries();
  });

  it('exposes query pass-through and zeroed effective values without a selection', () => {
    const { result } = renderForm();

    expect(result.current.suppliers).toEqual(suppliers);
    expect(result.current.items).toEqual([item]);
    expect(result.current.effectiveCurrentPrice).toBe(0);
    expect(result.current.effectiveCurrentQty).toBe(0);
    expect(result.current.selectedItem).toBeNull();
  });

  it('prefers item-details values once loaded', async () => {
    mockQueries({ details: { price: 4.5, onHand: 9 } });
    const hook = renderForm();

    await selectItem(hook);

    expect(hook.result.current.effectiveCurrentPrice).toBe(4.5);
    expect(hook.result.current.effectiveCurrentQty).toBe(9);
  });

  it('falls back to the search-result values while details are pending', async () => {
    const hook = renderForm();

    await selectItem(hook);

    expect(hook.result.current.effectiveCurrentPrice).toBe(3);
    expect(hook.result.current.effectiveCurrentQty).toBe(7);
  });

  it('falls back to zero when neither source carries values', async () => {
    const bare = { id: 'it-2', name: 'Bare' } as ItemOption;
    const hook = renderForm();

    act(() => {
      hook.result.current.setSelectedItem(bare);
    });

    await waitFor(() => {
      expect(hook.result.current.effectiveCurrentPrice).toBe(0);
      expect(hook.result.current.effectiveCurrentQty).toBe(0);
    });
  });

  it('blocks submission with the no-item message when the selection is gone', async () => {
    const hook = renderForm();

    // Valid form values but no selection: the guard, not the schema, fires.
    act(() => {
      hook.result.current.setValue('itemId', 'it-1');
      hook.result.current.setValue('newPrice', 5);
    });
    await act(async () => {
      await hook.result.current.onSubmit();
    });

    expect(hook.result.current.formError).toBe('errors:inventory.selection.noItemSelected');
    expect(changePriceMock).not.toHaveBeenCalled();
  });

  it('blocks submission in read-only demo mode', async () => {
    const hook = renderForm({ readOnly: true });
    await selectItem(hook);

    act(() => {
      hook.result.current.setValue('newPrice', 5);
    });
    await act(async () => {
      await hook.result.current.onSubmit();
    });

    expect(hook.result.current.formError).toBe('common:demoDisabled');
    expect(changePriceMock).not.toHaveBeenCalled();
  });

  it('submits, toasts, notifies, and closes on success', async () => {
    changePriceMock.mockResolvedValue({ ok: true } as never);
    const hook = renderForm();
    await selectItem(hook);

    act(() => {
      hook.result.current.setValue('newPrice', 5.5);
    });
    await act(async () => {
      await hook.result.current.onSubmit();
    });

    expect(changePriceMock).toHaveBeenCalledWith({ id: 'it-1', price: 5.5 });
    expect(toastSpy).toHaveBeenCalledWith('inventory:price.priceUpdatedTo', 'success');
    expect(hook.onPriceChanged).toHaveBeenCalled();
    expect(hook.onClose).toHaveBeenCalled();
    expect(hook.result.current.selectedItem).toBeNull();
  });

  it('tolerates an omitted onPriceChanged callback on success', async () => {
    changePriceMock.mockResolvedValue({ ok: true } as never);
    const onClose = vi.fn();
    const hook = renderHook(() => usePriceChangeForm({ isOpen: true, onClose }));

    act(() => {
      hook.result.current.setSelectedItem(item);
    });
    await waitFor(() => expect(hook.result.current.selectedItem).toEqual(item));
    act(() => {
      hook.result.current.setValue('newPrice', 5);
    });
    await act(async () => {
      await hook.result.current.onSubmit();
    });

    // The default no-op callback absorbs the notification; close still runs.
    expect(onClose).toHaveBeenCalled();
  });

  it.each([
    ['forbidden', 'errors:inventory.businessRules.adminOnly'],
    ['not_found', 'errors:inventory.businessRules.itemNotFound'],
    ['conflict', 'errors:inventory.requests.failedToChangePrice'],
  ])('maps the %s error token to its message', async (token, message) => {
    changePriceMock.mockResolvedValue({ ok: false, errorToken: token } as never);
    const hook = renderForm();
    await selectItem(hook);

    act(() => {
      hook.result.current.setValue('newPrice', 5);
    });
    await act(async () => {
      await hook.result.current.onSubmit();
    });

    expect(hook.result.current.formError).toBe(message);
    expect(hook.onClose).not.toHaveBeenCalled();
  });

  it('logs thrown transport errors and shows the generic message', async () => {
    changePriceMock.mockRejectedValue(new Error('boom'));
    const hook = renderForm();
    await selectItem(hook);

    act(() => {
      hook.result.current.setValue('newPrice', 5);
    });
    await act(async () => {
      await hook.result.current.onSubmit();
    });

    expect(logErrorMock).toHaveBeenCalledWith('Price change error:', expect.any(Error));
    expect(hook.result.current.formError).toBe('errors:inventory.requests.failedToChangePrice');
  });

  it('handleClose resets selection state and calls onClose', async () => {
    const hook = renderForm();
    await selectItem(hook);

    act(() => {
      hook.result.current.handleClose();
    });

    expect(hook.result.current.selectedItem).toBeNull();
    expect(hook.result.current.itemQuery).toBe('');
    expect(hook.result.current.formError).toBeNull();
    expect(hook.onClose).toHaveBeenCalled();
  });
});
