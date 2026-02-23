/**
 * @file ToastContext.test.ts
 * @module __tests__/context/toast/ToastContext
 * @description Contract tests for the ultra-light toast context (`ToastContext` + `useToast`).
 *
 * Contract under test:
 * - `useToast()` returns a callable toast function.
 * - When a provider value is supplied, `useToast()` returns that exact function.
 * - When used without a provider, the default is a no-op function (safe to call).
 *
 * Out of scope:
 * - Toast UI rendering, enqueue/dequeue behavior, and MUI Alert integration.
 *
 * Test strategy:
 * - Use `renderHook` to validate the consumer path.
 * - Keep this test `.ts` (no JSX) and use `React.createElement` for wrappers.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ToastContext, useToast, type ToastFn } from '../../../context/toast/ToastContext';

describe('ToastContext', () => {
  it('returns a callable no-op function when no provider is present', () => {
    // The module intentionally provides a no-op default to avoid hard failures
    // in unauthenticated shells or misconfigured test harnesses.
    const { result } = renderHook(() => useToast());
    expect(() => result.current('hello', 'success')).not.toThrow();
  });

  it('returns the provider value function when wrapped', () => {
    const toastFn: ToastFn = vi.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(ToastContext.Provider, { value: toastFn }, children);

    const { result } = renderHook(() => useToast(), { wrapper });
    expect(result.current).toBe(toastFn);
  });

  it.each(['success', 'info', 'warning', 'error'] as const)('accepts severity "%s"', (severity) => {
    const toastFn: ToastFn = vi.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(ToastContext.Provider, { value: toastFn }, children);

    const { result } = renderHook(() => useToast(), { wrapper });
    result.current('msg', severity);
    expect(toastFn).toHaveBeenCalledWith('msg', severity);
  });
});
