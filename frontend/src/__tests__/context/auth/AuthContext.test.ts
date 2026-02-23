/**
 * @file AuthContext.test.ts
 * @module __tests__/context/auth/AuthContext
 * @description Contract tests for the `AuthContext` object.
 *
 * Contract under test:
 * - The context default value is `undefined` (consumers must be wrapped).
 * - When wrapped with a provider, consumers receive the supplied value.
 *
 * Out of scope:
 * - `AuthProvider` session hydration and side-effects (covered in `AuthProvider.test.tsx`).
 * - HTTP client behavior and OAuth redirect wiring.
 *
 * Test strategy:
 * - Validate React Context behavior via `useContext` instead of checking implementation details
 *   like `Provider`/`Consumer` properties.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AuthContextType } from '../../../context/auth/authTypes';
import { AuthContext } from '../../../context/auth/AuthContext';

function ContextProbe() {
  const value = React.useContext(AuthContext);

  // This file is intentionally `.ts` (no JSX). Use `createElement` to keep the test portable.
  return React.createElement(
    'div',
    { 'data-testid': 'ctx', 'data-has-value': value ? 'true' : 'false' },
    value ? 'present' : 'missing'
  );
}

describe('AuthContext', () => {
  it('is undefined outside the provider', () => {
    render(React.createElement(ContextProbe));
    expect(screen.getByTestId('ctx')).toHaveTextContent('missing');
  });

  it('provides the supplied value to consumers', () => {
    const value: AuthContextType = {
      user: null,
      setUser: vi.fn(),
      login: vi.fn(),
      loginAsDemo: vi.fn(),
      logout: vi.fn(),
      loading: false,
      logoutInProgress: false,
    };

    render(
      React.createElement(
        AuthContext.Provider,
        { value },
        React.createElement(ContextProbe)
      )
    );

    expect(screen.getByTestId('ctx')).toHaveTextContent('present');
  });
});
