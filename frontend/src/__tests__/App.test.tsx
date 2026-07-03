/**
 * @file App.test.tsx
 * @module __tests__/App
 * @description Contract tests for the root `App` component.
 *
 * Contract under test:
 * - Renders the router inside the global providers (Help, Settings).
 * - The help panel is NOT mounted here since CB-APP83; it lives inside the
 *   shells so it receives the active theme.
 *
 * Out of scope:
 * - MUI implementation details (e.g., `Box` class names / generated styles).
 * - Router configuration, shell composition, and page behavior (tested elsewhere).
 *
 * Test strategy:
 * - Mock providers and the router as stable `data-testid` markers.
 * - Assert presence only.
 */

import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock providers
vi.mock('../context/settings/SettingsContext', () => ({
  SettingsProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../context/help/HelpContext', () => ({
  HelpProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../routes/AppRouter', () => ({
  default: () => <div data-testid="app-router">Router</div>,
}));

import App from '../App';

function renderSubject() {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the router inside the global providers', () => {
    renderSubject();
    expect(screen.getByTestId('app-router')).toBeInTheDocument();
  });

  it('does not mount the help panel at root (lives in the shells since CB-APP83)', () => {
    renderSubject();
    expect(screen.queryByTestId('help-panel')).toBeNull();
  });
});
