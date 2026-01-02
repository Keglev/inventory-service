import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeMode } from '@/app/public-shell/hooks/useThemeMode';

// Verifies theme mode persistence, defaults, and toggling.
describe('useThemeMode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to light when storage is empty', () => {
    const { result } = renderHook(() => useThemeMode());

    expect(result.current.themeMode).toBe('light');
  });

  it('initializes from stored theme mode', () => {
    // Should respect previously saved preference.
    localStorage.setItem('themeMode', 'dark');

    const { result } = renderHook(() => useThemeMode());

    expect(result.current.themeMode).toBe('dark');
  });

  it('setThemeMode persists and updates state', () => {
    const { result } = renderHook(() => useThemeMode());

    act(() => {
      result.current.setThemeMode('dark');
    });

    expect(result.current.themeMode).toBe('dark');
    expect(localStorage.getItem('themeMode')).toBe('dark');
  });

  it('toggleThemeMode flips between light and dark', () => {
    const { result } = renderHook(() => useThemeMode());

    act(() => {
      result.current.toggleThemeMode();
    });

    expect(result.current.themeMode).toBe('dark');
    expect(localStorage.getItem('themeMode')).toBe('dark');
  });
});
