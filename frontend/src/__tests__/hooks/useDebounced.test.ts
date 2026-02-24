/**
 * @file useDebounced.test.ts
 * @module __tests__/hooks/useDebounced
 * @description Enterprise contract tests for `useDebounced`.
 *
 * Contract under test:
 * - Returns the input value immediately on initial render.
 * - Updates the returned value only after the configured delay.
 * - Cancels pending updates when value changes again before the delay elapses.
 *
 * Out of scope:
 * - Rendering behavior of any particular component using `useDebounced`.
 * - Browser timer edge cases (this is a React hook contract test).
 *
 * Test strategy:
 * - Use fake timers to deterministically drive `setTimeout` without waiting in real time.
 * - Advance timers inside `act()` to ensure React flushes effects/state updates.
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebounced } from '@/hooks/useDebounced';

describe('useDebounced', () => {
  beforeEach(() => {
    // Deterministic timer control for debounce behavior.
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Ensure timers do not leak across tests.
    vi.useRealTimers();
  });

  it('debounces value updates by the given delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delayMs }: { value: string; delayMs: number }) => useDebounced(value, delayMs),
      { initialProps: { value: 'a', delayMs: 200 } },
    );

    // Initial render returns the immediate value (no debounce on first render).
    expect(result.current).toBe('a');

    // Change value: hook should keep returning the previous value until the delay elapses.
    rerender({ value: 'b', delayMs: 200 });
    expect(result.current).toBe('a');

    act(() => {
      // Drive timers just *before* the threshold.
      vi.advanceTimersByTime(199);
    });
    expect(result.current).toBe('a');

    act(() => {
      // Cross the threshold; React should commit the updated state.
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('b');
  });

  it('cancels intermediate updates when value changes rapidly', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounced(value, 200),
      { initialProps: { value: 'a' } },
    );

    // Two quick rerenders should cancel the pending "b" timeout and only commit "c".
    rerender({ value: 'b' });
    rerender({ value: 'c' });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe('c');
  });
});
