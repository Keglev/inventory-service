/**
 * @file useEditSupplierConfirmation.test.ts
 * @module __tests__/components/pages/suppliers/EditSupplierDialog/useEditSupplierConfirmation
 * @description Orchestration tests for `useEditSupplierConfirmation`.
 *
 * Contract under test:
 * - Exposes `showConfirmation` and `pendingChanges` state.
 * - Allows toggling confirmation visibility.
 * - Allows setting pending changes and resetting back to defaults.
 *
 * Out of scope:
 * - API submission (handled by `useEditSupplierForm`).
 *
 * Test strategy:
 * - Treat this hook as a small state machine: mutate via public setters and assert observable state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { EditSupplierForm } from '../../../../../api/suppliers';

import { useEditSupplierConfirmation } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierConfirmation';

describe('useEditSupplierConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with confirmation hidden and no pending changes', () => {
    const { result } = renderHook(() => useEditSupplierConfirmation());
    expect(result.current.showConfirmation).toBe(false);
    expect(result.current.pendingChanges).toBeNull();
  });

  it('updates visibility state when setShowConfirmation is called', () => {
    const { result } = renderHook(() => useEditSupplierConfirmation());
    act(() => {
      result.current.setShowConfirmation(true);
    });
    expect(result.current.showConfirmation).toBe(true);
  });

  it('stores pending changes and resets them correctly', () => {
    const pending: EditSupplierForm = {
      supplierId: 'supplier-1',
      contactName: 'New Contact',
      phone: '555-7000',
      email: 'new@acme.com',
    };

    const { result } = renderHook(() => useEditSupplierConfirmation());

    act(() => {
      result.current.setPendingChanges(pending);
      result.current.setShowConfirmation(true);
    });

    expect(result.current.pendingChanges).toEqual(pending);
    expect(result.current.showConfirmation).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.pendingChanges).toBeNull();
    expect(result.current.showConfirmation).toBe(false);
  });
});
