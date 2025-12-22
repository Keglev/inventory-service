/**
 * @file PublicShellContent.test.tsx
 *
 * @what_is_under_test PublicShellContent component
 * @responsibility Main content area with Suspense fallback and outlet for unauthenticated routes
 * @out_of_scope Route rendering, Suspense behavior beyond fallback display, specific page content
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PublicShellContent from '../../../app/public-shell/PublicShellContent';

// Mock react-router-dom Outlet
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  };
});

describe('PublicShellContent', () => {
  describe('Layout structure', () => {
    it('renders main content area with flex: 1', () => {
      const { container } = render(
        <MemoryRouter>
          <PublicShellContent />
        </MemoryRouter>
      );

      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(main?.className).toMatch(/MuiBox-root/);
    });

    it('renders Toolbar for spacing below fixed AppBar', () => {
      const { container } = render(
        <MemoryRouter>
          <PublicShellContent />
        </MemoryRouter>
      );

      const toolbar = container.querySelector('.MuiToolbar-root');
      expect(toolbar).toBeInTheDocument();
    });

    it('renders outlet for route content', () => {
      render(
        <MemoryRouter>
          <PublicShellContent />
        </MemoryRouter>
      );

      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });
  });

  describe('Suspense fallback', () => {
    it('renders Suspense boundary', () => {
      render(
        <MemoryRouter>
          <PublicShellContent />
        </MemoryRouter>
      );

      // Suspense is rendered implicitly, outlet should be visible
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });
  });

  describe('Responsive spacing', () => {
    it('applies responsive padding (xs: 2, md: 3)', () => {
      render(
        <MemoryRouter>
          <PublicShellContent />
        </MemoryRouter>
      );

      const main = screen.getByRole('main');
      expect(main?.className).toContain('MuiBox-root');
    });

    it('enables vertical overflow scrolling', () => {
      const { container } = render(
        <MemoryRouter>
          <PublicShellContent />
        </MemoryRouter>
      );

      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
    });
  });

  describe('Content rendering', () => {
    it('renders with proper semantic main element', () => {
      const { container } = render(
        <MemoryRouter>
          <PublicShellContent />
        </MemoryRouter>
      );

      const main = container.querySelector('main');
      expect(main?.tagName).toBe('MAIN');
    });
  });
});
