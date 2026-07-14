/**
 * @file mapSupplierErrors.ts
 * @module dialogs/EditSupplierDialog/mapSupplierErrors
 *
 * @summary
 * Maps a failed supplier update to translated, user-facing copy.
 *
 * @enterprise
 * - Thin adapter over the shared supplier error classifier: the edit dialog
 *   pins the operation to 'update' so a 409 reads as a duplicate name rather
 *   than as the delete dialog's linked-items rule.
 * - Classification is driven by the structured error envelope, never by
 *   matching substrings in the server's free-text message.
 */
import type { TFunction } from 'i18next';

import { supplierErrorMessage, type SupplierErrorEnvelope } from '../supplierServerErrors';

export const mapSupplierError = (
  failure: SupplierErrorEnvelope,
  t: TFunction<['common', 'suppliers', 'errors']>
): string => supplierErrorMessage(failure, t, 'update');
