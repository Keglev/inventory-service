/**
 * @file usePublicShellToast.test.ts
 * @module __tests__/app/public-shell/hooks/usePublicShellToast
 * @description
 * Tests for the usePublicShellToast hook.
 *
 * Scope:
 * - Default state (no toast)
 * - showToast behavior (default + custom severity)
 * - hideToast behavior (closes current toast without dropping content)
 * - setToast direct control (can reset to null)
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { usePublicShellToast } from '@/app/public-shell/hooks/usePublicShellToast';

describe('usePublicShellToast', () => {
  beforeEach(() => {
    // Hook has no external dependencies, but we keep a clean pattern across the suite.
  });

  it('starts with no toast', () => {
    // Initial contract: no toast is visible until explicitly triggered.
    const { result } = renderHook(() => usePublicShellToast());

    expect(result.current.toast).toBeNull();
  });

  it('showToast opens a toast with default severity', () => {
    // Default severity should be "success" for positive confirmation messages.
    const { result } = renderHook(() => usePublicShellToast());

    act(() => {
      result.current.showToast('Saved');
    });

    expect(result.current.toast).toEqual({ open: true, msg: 'Saved', severity: 'success' });
  });

  it('showToast supports a custom severity', () => {
    // Contract: consumers can override severity for warning/error/info use cases.
    const { result } = renderHook(() => usePublicShellToast());

    act(() => {
      result.current.showToast('Heads up', 'info');
    });

    expect(result.current.toast).toEqual({ open: true, msg: 'Heads up', severity: 'info' });
  });

  it('hideToast closes the current toast while preserving message and severity', () => {
    // Business rule: hiding should only affect visibility, not content.
    const { result } = renderHook(() => usePublicShellToast());

    act(() => {
      result.current.showToast('Warning', 'warning');
      result.current.hideToast();
    });

    expect(result.current.toast).toEqual({ open: false, msg: 'Warning', severity: 'warning' });
  });

  it('setToast can reset the toast to null', () => {
    // Escape hatch: direct state control supports full reset flows.
    const { result } = renderHook(() => usePublicShellToast());

    act(() => {
      result.current.showToast('Error', 'error');
      result.current.setToast(null);
    });

    expect(result.current.toast).toBeNull();
  });
});
