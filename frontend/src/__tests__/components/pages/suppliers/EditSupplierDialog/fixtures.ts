/**
 * @file fixtures.ts
 * @module __tests__/components/pages/suppliers/EditSupplierDialog/fixtures
 * @description Deterministic fixture builders for EditSupplierDialog tests.
 *
 * Design goals:
 * - Deterministic defaults: stable IDs/text so assertions are predictable.
 * - Minimal surface area: only provide the fields tests actually need.
 * - Easy overrides: callers can override just the relevant fields per scenario.
 *
 * Non-goals:
 * - Validating domain rules or API constraints (covered by feature tests / backend).
 * - Generating random data (randomness makes failures harder to reproduce).
 */

import type { EditSupplierForm } from '../../../../../api/suppliers';
import type { SupplierRow } from '../../../../../api/suppliers/types';

/**
 * Creates a stable `SupplierRow` for list/search scenarios.
 *
 * Notes:
 * - Defaults are intentionally “boring” and readable.
 * - `overrides` are applied last to keep call sites concise.
 */
export const supplierRow = (overrides: Partial<SupplierRow> = {}): SupplierRow => ({
  id: 'supplier-1',
  name: 'Acme Corp',
  contactName: 'Old Contact',
  phone: '555-5000',
  email: 'old@acme.com',
  createdBy: 'owner@example.com',
  createdAt: '2023-01-01',
  ...overrides,
});

/**
 * Creates a stable set of edited supplier values used by the form/review flow.
 *
 * Notes:
 * - Uses the same default `supplierId` as `supplierRow()` for consistency.
 * - `overrides` are applied last so tests can focus on the field under test.
 */
export const editSupplierChanges = (overrides: Partial<EditSupplierForm> = {}): EditSupplierForm => ({
  supplierId: 'supplier-1',
  contactName: 'New Contact',
  phone: '555-6000',
  email: 'new@acme.com',
  ...overrides,
});
