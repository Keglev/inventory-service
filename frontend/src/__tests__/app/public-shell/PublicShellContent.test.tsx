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
 * not on route definitions or nested page components. When the suspend
 * flag is raised, the stub throws a never-resolving promise so the
 * Suspense fallback becomes observable.
 */
const outletShouldSuspend = { value: false };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    Outlet: () => {
      if (outletShouldSuspend.value) throw new Promise(() => {});
      return <div data-testid="outlet">Outlet Content</div>;
    },
  };
});

describe('PublicShellContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    outletShouldSuspend.value = false;
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
    // We don't test Suspense internals; we only ensure it does not block normal rendering.
    renderContent();

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('shows the loading fallback while a lazy route is still resolving', () => {
    outletShouldSuspend.value = true;

    renderContent();

    expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
    // The fallback renders the shared loading copy from the common namespace.
    expect(screen.getByText(/loading|laden|lädt/i)).toBeInTheDocument();
  });
});
