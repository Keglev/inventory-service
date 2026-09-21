/**
 * @file itemFormServerErrors.test.ts
 * @module __tests__/components/pages/inventory/ItemFormDialog/itemFormServerErrors
 *
 * @testing pages/inventory/dialogs/ItemFormDialog/itemFormServerErrors
 *
 * @description
 * Contract: the backend's `fieldErrors` map is a SIGNAL naming which input was
 * rejected, never copy. Its text is English and the display language is German,
 * so the classifier must discard the message and attach a translated key. Which
 * key depends on the error token: a 409 names the offending field precisely, and
 * anything else only reports that some rule fired without naming it.
 *
 * Out of scope: how the key becomes text (utils/fieldErrorText owns that), and
 * how the envelope is lifted off the HTTP response (the api layer owns that).
 * This module only decides which key a rejected input earns.
 */
import { describe, expect, it, vi } from 'vitest';

import { applyItemFormServerError } from '../../../../../pages/inventory/dialogs/ItemFormDialog/itemFormServerErrors';
import type { ItemFormServerErrorDeps } from '../../../../../pages/inventory/dialogs/ItemFormDialog/itemFormServerErrors';

const deps = () => {
  const setError = vi.fn();
  const setFormError = vi.fn();
  const t = ((key: string) => key) as unknown as ItemFormServerErrorDeps['t'];
  return { setError, setFormError, t };
};

describe('applyItemFormServerError', () => {
  it('attaches the duplicate-name key when a conflict names the name field', () => {
    const d = deps();
    applyItemFormServerError(
      { errorToken: 'conflict', fieldErrors: { name: 'An inventory item with this name and price already exists.' } },
      d
    );
    expect(d.setError).toHaveBeenCalledWith('name', {
      message: 'errors:inventory.conflicts.duplicateName',
    });
  });

  it('attaches the duplicate-sku key to the code input when a conflict names sku', () => {
    const d = deps();
    applyItemFormServerError(
      { errorToken: 'conflict', fieldErrors: { sku: 'Another inventory item with this SKU already exists.' } },
      d
    );
    // The backend calls it 'sku'; the form calls it 'code'.
    expect(d.setError).toHaveBeenCalledWith('code', {
      message: 'errors:inventory.conflicts.duplicateSku',
    });
  });

  it('never lets the English server message reach an input', () => {
    const d = deps();
    const english = 'Another inventory item with this SKU already exists.';
    applyItemFormServerError({ errorToken: 'conflict', fieldErrors: { sku: english } }, d);

    const messages = d.setError.mock.calls.map(([, payload]) => payload.message);
    expect(messages).not.toContain(english);
    for (const message of messages) {
      expect(message).toMatch(/^errors:/);
    }
  });

  it('flags the field neutrally when the token is not a conflict', () => {
    const d = deps();
    // 400 bean validation: the server reports that a rule fired, not which one.
    applyItemFormServerError(
      { errorToken: 'bad_request', fieldErrors: { price: 'Price must be greater than zero' } },
      d
    );
    expect(d.setError).toHaveBeenCalledWith('price', { message: 'errors:validation.invalid' });
  });

  it('attributes every field the server names', () => {
    const d = deps();
    applyItemFormServerError(
      { errorToken: 'bad_request', fieldErrors: { name: 'x', quantity: 'y', supplierId: 'z' } },
      d
    );
    expect(d.setError).toHaveBeenCalledTimes(3);
    expect(d.setError.mock.calls.map(([field]) => field)).toEqual(
      expect.arrayContaining(['name', 'quantity', 'supplierId'])
    );
  });

  it('raises the banner when at least one input was flagged', () => {
    const d = deps();
    applyItemFormServerError({ errorToken: 'conflict', fieldErrors: { name: 'x' } }, d);
    expect(d.setFormError).toHaveBeenCalledWith('errors:form.validationFailed');
  });

  it('falls back to the form-level message when no named field maps to an input', () => {
    const d = deps();
    applyItemFormServerError(
      { errorToken: 'bad_request', fieldErrors: { somethingUnmapped: 'x' } },
      d
    );
    expect(d.setError).not.toHaveBeenCalled();
    expect(d.setFormError).toHaveBeenCalledWith('errors:inventory.server.serverError');
  });

  it('falls back to the name field when a conflict carries no field attribution', () => {
    const d = deps();
    applyItemFormServerError({ errorToken: 'conflict' }, d);
    expect(d.setError).toHaveBeenCalledWith('name', {
      message: 'errors:inventory.conflicts.duplicateName',
    });
    expect(d.setFormError).toHaveBeenCalledWith('errors:form.validationFailed');
  });

  it('uses the generic server message when the token is unrelated', () => {
    const d = deps();
    applyItemFormServerError({ errorToken: 'not_found' }, d);
    expect(d.setError).not.toHaveBeenCalled();
    expect(d.setFormError).toHaveBeenCalledWith('errors:inventory.server.serverError');
  });
});
