/**
 * @file App.test.tsx
 * @module __tests__/App
 *
 * @summary
 * Test suite for App component.
 * Tests the root application component including routing, error boundary, and layout.
 *
 * @what_is_under_test App component - root application with routing and global layout
 * @responsibility Render AppRouter, Footer, and HelpPanel; handle render errors gracefully
 * @out_of_scope Specific route implementations, individual page content, Router configuration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock providers
vi.mock('../context/settings/SettingsContext', () => ({
  SettingsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../context/help/HelpContext', () => ({
  HelpProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../routes/AppRouter', () => ({
  default: () => <div data-testid="app-router">Router</div>,
}));

vi.mock('../app/footer', () => ({
  AppFooter: () => <footer data-testid="app-footer">Footer</footer>,
}));

vi.mock('../components/help/HelpPanel', () => ({
  default: () => <div data-testid="help-panel">Help Panel</div>,
}));

import App from '../App';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the application', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('app-router')).toBeInTheDocument();
  });

  it('renders the footer', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('app-footer')).toBeInTheDocument();
  });

  it('renders the help panel', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('help-panel')).toBeInTheDocument();
  });

  it('renders all main layout components', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('app-router')).toBeInTheDocument();
    expect(screen.getByTestId('app-footer')).toBeInTheDocument();
    expect(screen.getByTestId('help-panel')).toBeInTheDocument();
  });

  it('has proper flex layout container', () => {
    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    const mainBox = container.querySelector('[class*="MuiBox"]');
    expect(mainBox).toBeInTheDocument();
  });
});
