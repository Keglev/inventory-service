/**
 * @file useEditSupplierConfirmation.test.ts
 *
 * @what_is_under_test useEditSupplierConfirmation hook
 * @responsibility Manage confirmation dialog visibility and pending changes state
 * @out_of_scope Component rendering, API layer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useEditSupplierConfirmation } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierConfirmation';

describe('useEditSupplierConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with confirmation hidden', () => {
    const { result } = renderHook(() => useEditSupplierConfirmation());
    expect(result.current.showConfirmation).toBe(false);
  });

  it('initializes with no pending changes', () => {
    const { result } = renderHook(() => useEditSupplierConfirmation());
    expect(result.current.pendingChanges).toBeNull();
  });

  it('provides setShowConfirmation function', () => {
    const { result } = renderHook(() => useEditSupplierConfirmation());
    expect(result.current.setShowConfirmation).toBeDefined();
  });

  it('provides setPendingChanges function', () => {
    const { result } = renderHook(() => useEditSupplierConfirmation());
    expect(result.current.setPendingChanges).toBeDefined();
  });

  it('provides reset function', () => {
    const { result } = renderHook(() => useEditSupplierConfirmation());
    expect(result.current.reset).toBeDefined();
  });
});
