/**
 * @file fieldErrorText.test.ts
 * @module __tests__/unit/utils/fieldErrorText
 *
 * @testing utils/fieldErrorText
 *
 * @description
 * Contract: a react-hook-form field error carries an i18n KEY, and this helper
 * is the single boundary that turns it into display text. The tests below pin
 * that contract from both directions — a key must be resolved (never echoed),
 * and a valid field must yield an empty string so a MUI TextField keeps its
 * helper row rather than collapsing it.
 *
 * Out of scope: which key any particular schema chooses (that is the schema's
 * own test), and how a server-attributed field error is classified (that is
 * the classifier's test). This module only resolves whatever key it is handed.
 */
import { describe, expect, it } from 'vitest';
import type { FieldError } from 'react-hook-form';

import { tEn } from '../../test/i18nEn';
import { fieldErrorText } from '../../../utils/fieldErrorText';

const t = tEn as unknown as Parameters<typeof fieldErrorText>[1];

describe('fieldErrorText', () => {
  it('should_return_empty_string_when_the_field_is_valid', () => {
    expect(fieldErrorText(undefined, t)).toBe('');
  });

  it('should_return_empty_string_when_the_error_carries_no_message', () => {
    expect(fieldErrorText({ type: 'required' } as FieldError, t)).toBe('');
  });

  it('should_return_empty_string_when_the_message_is_an_empty_string', () => {
    expect(fieldErrorText({ type: 'required', message: '' } as FieldError, t)).toBe('');
  });

  it('should_resolve_the_key_to_locale_copy_when_the_message_is_an_i18n_key', () => {
    const out = fieldErrorText(
      { type: 'too_small', message: 'errors:validation.required' } as FieldError,
      t
    );
    expect(out).toBe(tEn('errors:validation.required'));
    expect(out).not.toBe('errors:validation.required');
  });

  it('should_resolve_every_key_the_shared_validation_subtree_publishes', () => {
    const keys = [
      'errors:validation.required',
      'errors:validation.invalidEmail',
      'errors:validation.nonNegative',
      'errors:validation.positive',
      'errors:validation.quantityUnchanged',
      'errors:validation.reasonInvalidForIncrease',
      'errors:validation.reasonInvalidForDecrease',
    ];
    for (const key of keys) {
      const out = fieldErrorText({ type: 'custom', message: key } as FieldError, t);
      expect(out, `${key} must resolve to copy, not echo`).not.toBe(key);
      expect(out.length).toBeGreaterThan(0);
    }
  });

  it('should_ignore_a_non_string_message_rather_than_stringify_it', () => {
    const nested = { type: 'custom', message: { deep: true } } as unknown as FieldError;
    expect(fieldErrorText(nested, t)).toBe('');
  });
});
