/**
 * @file useThemeMode.test.ts
 * @module __tests__/app/public-shell/hooks/useThemeMode
 * @description
 * Tests for the useThemeMode hook.
 *
 * Scope:
 * - Default theme mode when storage is empty
 * - Initialization from persisted localStorage value
 * - setThemeMode persistence + state update
 * - toggleThemeMode behavior (light <-> dark)
 *
 * Out of scope:
 * - ThemeProvider integration / actual palette application
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeMode } from '@/app/public-shell/hooks/useThemeMode';

describe('useThemeMode', () => {
  beforeEach(() => {
    // Ensure tests are independent and do not leak persisted values.
    localStorage.clear();
  });

  it('defaults to "light" when storage is empty', () => {
    // Contract: the public shell starts in light mode unless the user previously chose otherwise.
    const { result } = renderHook(() => useThemeMode());

    expect(result.current.themeMode).toBe('light');
  });

  it('initializes from stored theme mode when present', () => {
    // Contract: previously saved preference is restored on first render.
    localStorage.setItem('themeMode', 'dark');

    const { result } = renderHook(() => useThemeMode());

    expect(result.current.themeMode).toBe('dark');
  });

  it('setThemeMode updates state and persists the preference', () => {
    // Contract: explicit set should update both in-memory state and persistence.
    const { result } = renderHook(() => useThemeMode());

    act(() => {
      result.current.setThemeMode('dark');
    });

    expect(result.current.themeMode).toBe('dark');
    expect(localStorage.getItem('themeMode')).toBe('dark');
  });

  it('toggleThemeMode flips between light and dark and persists', () => {
    // Contract: toggle is symmetric and persists the resulting state.
    const { result } = renderHook(() => useThemeMode());

    act(() => {
      result.current.toggleThemeMode();
    });

    expect(result.current.themeMode).toBe('dark');
    expect(localStorage.getItem('themeMode')).toBe('dark');

    act(() => {
      result.current.toggleThemeMode();
    });

    expect(result.current.themeMode).toBe('light');
    expect(localStorage.getItem('themeMode')).toBe('light');
  });
});
