import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePublicShellToast } from '@/app/public-shell/hooks/usePublicShellToast';

// Exercises toast show/hide flows and default severity.
describe('usePublicShellToast', () => {
  it('starts with no toast', () => {
    const { result } = renderHook(() => usePublicShellToast());

    expect(result.current.toast).toBeNull();
  });

  it('showToast sets open toast with default severity', () => {
    // Default severity should be success.
    const { result } = renderHook(() => usePublicShellToast());

    act(() => {
      result.current.showToast('Saved');
    });

    expect(result.current.toast).toEqual({ open: true, msg: 'Saved', severity: 'success' });
  });

  it('showToast supports custom severity', () => {
    const { result } = renderHook(() => usePublicShellToast());

    act(() => {
      result.current.showToast('Heads up', 'info');
    });

    expect(result.current.toast).toEqual({ open: true, msg: 'Heads up', severity: 'info' });
  });

  it('hideToast closes the current toast', () => {
    // Hide should only flip the open flag, preserving message and severity.
    const { result } = renderHook(() => usePublicShellToast());

    act(() => {
      result.current.showToast('Warning', 'warning');
      result.current.hideToast();
    });

    expect(result.current.toast).toEqual({ open: false, msg: 'Warning', severity: 'warning' });
  });

  it('setToast can reset toast to null', () => {
    const { result } = renderHook(() => usePublicShellToast());

    act(() => {
      result.current.showToast('Error', 'error');
      result.current.setToast(null);
    });

    expect(result.current.toast).toBeNull();
  });
});
