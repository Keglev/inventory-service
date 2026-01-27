/**
 * @file PublicShellContent.test.tsx
 * @module __tests__/app/public-shell/PublicShellContent
 * @description
 * Tests for PublicShellContent.
 *
 * Scope:
 * - Renders semantic <main> container for public routes
 * - Includes Toolbar spacer for a fixed AppBar
 * - Provides an Outlet for nested unauthenticated routes
 * - Wraps route outlet with a Suspense boundary (verified indirectly via outlet rendering)
 *
 * Out of scope:
 * - Route configuration and page rendering logic
 * - Suspense loading UX details beyond basic presence
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PublicShellContent from '../../../app/public-shell/PublicShellContent';

/**
 * Router stub:
 * We replace Outlet to keep this test focused on layout composition,
 * not on route definitions or nested page components.
 */
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  };
});

describe('PublicShellContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderContent() {
    return render(
      <MemoryRouter>
        <PublicShellContent />
      </MemoryRouter>,
    );
  }

  it('renders a semantic main region for the page content', () => {
    // Accessibility/structure contract: primary content lives in <main>.
    renderContent();

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders a Toolbar spacer below a fixed header', () => {
    // Layout contract: Toolbar provides top spacing equal to the AppBar height.
    const { container } = renderContent();

    expect(container.querySelector('.MuiToolbar-root')).toBeInTheDocument();
  });

  it('renders the router outlet for nested public routes', () => {
    // Composition contract: content area must provide an Outlet to render route children.
    renderContent();

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('keeps the outlet visible inside the Suspense boundary in the steady state', () => {
    // We don’t test Suspense internals; we only ensure it does not block normal rendering.
    renderContent();

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });
});
