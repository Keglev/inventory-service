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

  it('opens a toast with default severity when showToast is called', () => {
    // Default severity should be "success" for positive confirmation messages.
    const { result } = renderHook(() => usePublicShellToast());

    act(() => {
      result.current.showToast('Saved');
    });

    expect(result.current.toast).toEqual({ open: true, msg: 'Saved', severity: 'success' });
  });

  it('supports a custom severity when showToast is called', () => {
    // Contract: consumers can override severity for warning/error/info use cases.
    const { result } = renderHook(() => usePublicShellToast());

    act(() => {
      result.current.showToast('Heads up', 'info');
    });

    expect(result.current.toast).toEqual({ open: true, msg: 'Heads up', severity: 'info' });
  });

  it('closes the toast but keeps message and severity when hideToast is called', () => {
    // Business rule: hiding should only affect visibility, not content.
    const { result } = renderHook(() => usePublicShellToast());

    act(() => {
      result.current.showToast('Warning', 'warning');
      result.current.hideToast();
    });

    expect(result.current.toast).toEqual({ open: false, msg: 'Warning', severity: 'warning' });
  });

  it('resets the toast to null when setToast receives null', () => {
    // Escape hatch: direct state control supports full reset flows.
    const { result } = renderHook(() => usePublicShellToast());

    act(() => {
      result.current.showToast('Error', 'error');
      result.current.setToast(null);
    });

    expect(result.current.toast).toBeNull();
  });

  it('does nothing when hideToast is called with no toast', () => {
    const { result } = renderHook(() => usePublicShellToast());

    act(() => {
      result.current.hideToast();
    });

    expect(result.current.toast).toBeNull();
  });
});
