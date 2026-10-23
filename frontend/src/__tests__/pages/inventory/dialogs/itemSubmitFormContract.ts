/**
 * @file itemSubmitFormContract.ts
 * @module __tests__/pages/inventory/dialogs/itemSubmitFormContract
 * @testing Shared contract suite (fork 4 B, 2026-10-22)
 * @description The submit guards and failure handling that usePriceChangeForm
 * and useQuantityAdjustForm implement in parallel: the no-item and read-only
 * guards, errorToken mapping, transport-error logging and handleClose reset.
 * Each consumer spec keeps its own vi.mock calls and passes the mocked
 * mutation and logger in; titles are the ones both specs carried before the
 * suite existed. Consumers: PriceChangeDialog/usePriceChangeForm.test.ts,
 * QuantityAdjustDialog/useQuantityAdjustForm.test.ts.
 */
import { it, expect, type Mock } from 'vitest';
import { act } from '@testing-library/react';

/** The part of either hook's result the contract drives. */
export interface ItemSubmitFormResult {
  formError: string;
  selectedItem: unknown;
  itemQuery: string;
  setItemQuery: (query: string) => void;
  onSubmit: () => unknown;
  handleClose: () => void;
}

/** What renderHook returns, plus the callbacks the consumer passed in. */
export interface ItemSubmitFormHook {
  result: { current: ItemSubmitFormResult };
  onClose: Mock;
}

type ResultOf<H extends ItemSubmitFormHook> = H['result']['current'];

export interface ItemSubmitFormContract<H extends ItemSubmitFormHook> {
  renderForm: (options?: { readOnly?: boolean }) => H;
  selectItem: (hook: H) => Promise<void>;
  /** Query state the submit tests start from (the quantity flow needs live details). */
  arrangeLoadedItem: () => void;
  /** Sets the flow's new value (price or quantity) on a selected item. */
  enterNewValue: (result: ResultOf<H>) => void;
  /** Fills every form field validly while leaving the selection empty. */
  fillValuesWithoutSelection: (result: ResultOf<H>) => void;
  mutation: Mock;
  logError: Mock;
  errorTokens: Array<[token: string, message: string]>;
  transportLogPrefix: string;
  genericMessage: string;
}

/** The no-item and read-only guards: neither may reach the mutation. */
export function itSubmitGuards<H extends ItemSubmitFormHook>(c: ItemSubmitFormContract<H>): void {
  it('blocks submission with the no-item message when the selection is gone', async () => {
    const hook = c.renderForm();

    // Valid form values but no selection: the guard, not the schema, fires.
    act(() => {
      c.fillValuesWithoutSelection(hook.result.current);
    });
    await act(async () => {
      await hook.result.current.onSubmit();
    });

    expect(hook.result.current.formError).toBe('errors:inventory.selection.noItemSelected');
    expect(c.mutation).not.toHaveBeenCalled();
  });

  it('blocks submission in read-only demo mode', async () => {
    c.arrangeLoadedItem();
    const hook = c.renderForm({ readOnly: true });
    await c.selectItem(hook);

    act(() => {
      c.enterNewValue(hook.result.current);
    });
    await act(async () => {
      await hook.result.current.onSubmit();
    });

    expect(hook.result.current.formError).toBe('common:demoDisabled');
    expect(c.mutation).not.toHaveBeenCalled();
  });
}

/** errorToken mapping, transport-error logging and the handleClose reset. */
export function itSubmitFailuresAndClose<H extends ItemSubmitFormHook>(
  c: ItemSubmitFormContract<H>,
): void {
  it.each(c.errorTokens)('maps the %s error token to its message', async (token, message) => {
    c.arrangeLoadedItem();
    c.mutation.mockResolvedValue({ ok: false, errorToken: token });
    const hook = c.renderForm();
    await c.selectItem(hook);

    act(() => {
      c.enterNewValue(hook.result.current);
    });
    await act(async () => {
      await hook.result.current.onSubmit();
    });

    expect(hook.result.current.formError).toBe(message);
    expect(hook.onClose).not.toHaveBeenCalled();
  });

  it('logs thrown transport errors and shows the generic message', async () => {
    c.arrangeLoadedItem();
    c.mutation.mockRejectedValue(new Error('boom'));
    const hook = c.renderForm();
    await c.selectItem(hook);

    act(() => {
      c.enterNewValue(hook.result.current);
    });
    await act(async () => {
      await hook.result.current.onSubmit();
    });

    expect(c.logError).toHaveBeenCalledWith(c.transportLogPrefix, expect.any(Error));
    expect(hook.result.current.formError).toBe(c.genericMessage);
  });

  it('resets selection state and calls onClose when handleClose runs', async () => {
    const hook = c.renderForm();
    await c.selectItem(hook);
    // A typed query proves the reset: the field starts empty.
    act(() => {
      hook.result.current.setItemQuery('Bea');
    });
    expect(hook.result.current.itemQuery).toBe('Bea');

    act(() => {
      hook.result.current.handleClose();
    });

    expect(hook.result.current.selectedItem).toBeNull();
    expect(hook.result.current.itemQuery).toBe('');
    expect(hook.result.current.formError).toBe('');
    expect(hook.onClose).toHaveBeenCalled();
  });
}
