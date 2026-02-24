/**
 * @file useAuth.test.ts
 * @module __tests__/hooks/useAuth
 * @description Enterprise contract tests for the `@/hooks/useAuth` convenience hook.
 *
 * Contract under test:
 * - When called outside an `AuthContext.Provider`, `useAuth()` throws a clear, actionable error.
 * - When an `AuthContext.Provider` is present, `useAuth()` returns the exact context value.
 *
 * Out of scope:
 * - `AuthProvider` side effects (session hydration, localStorage demo session, redirects).
 * - Any business logic in consumers (guards/pages) that *use* this hook.
 *
 * Test strategy:
 * - Use `renderHook` to execute the hook directly.
 * - Provide a minimal `AuthContext.Provider` wrapper (no network / no router).
 * - Stub required context functions with `vi.fn()` and keep assertions contract-based.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { AuthContext } from '@/context/auth/AuthContext';
import type { AuthContextType } from '@/context/auth/authTypes';
import { useAuth } from '@/hooks/useAuth';

// Minimal context value to satisfy `AuthContextType`.
// Maintenance note: if `AuthContextType` evolves, update this stub accordingly.
const providerValue: AuthContextType = {
  user: null,
  setUser: vi.fn(),
  login: vi.fn(),
  loginAsDemo: vi.fn(),
  logout: vi.fn(),
  loading: false,
  logoutInProgress: false,
};

describe('useAuth (src/hooks/useAuth)', () => {
  it('throws when used outside AuthProvider (src/hooks)', () => {
    // This error message comes from the hook factory used by `@/hooks/useAuth`.
    // We treat it as a contract because it guides developers during integration.
    expect(() => renderHook(() => useAuth())).toThrowError(
      'useAuth must be used within the corresponding provider',
    );
  });

  it('returns AuthContext value when wrapped by provider (src/hooks)', () => {
    // Use a provider wrapper instead of `AuthProvider` to avoid executing hydration effects.
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
      React.createElement(AuthContext.Provider, { value: providerValue, children });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Identity equality is the strongest signal here: the hook returns the context object as-is.
    expect(result.current).toBe(providerValue);
  });
});
