/**
 * @file App.test.tsx
 * @module __tests__/App
 * @description Contract tests for the root `App` component.
 *
 * Contract under test:
 * - Renders the global layout: AppRouter, footer, and help panel.
 * - Keeps a deterministic DOM order (router -> footer -> help panel) to match the flex-column layout.
 *
 * Out of scope:
 * - MUI implementation details (e.g., `Box` class names / generated styles).
 * - Router configuration and page behavior (tested elsewhere).
 *
 * Test strategy:
 * - Mock leaf components as stable `data-testid` markers.
 * - Assert presence and basic ordering only.
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

vi.mock('../components/help/HelpPanel', () => ({
  default: () => <div data-testid="help-panel">Help Panel</div>,
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

  it('renders the global layout components', () => {
    renderSubject();
    expect(screen.getByTestId('app-router')).toBeInTheDocument();
    expect(screen.getByTestId('help-panel')).toBeInTheDocument();
  });

  it('renders components in router -> help order', () => {
    renderSubject();
    const router = screen.getByTestId('app-router');
    const helpPanel = screen.getByTestId('help-panel');

    expect(router.compareDocumentPosition(helpPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
