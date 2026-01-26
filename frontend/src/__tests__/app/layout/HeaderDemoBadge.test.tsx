/**
 * @file HeaderDemoBadge.test.tsx
 * @module __tests__/app/layout/header/HeaderDemoBadge
 * @description
 * Tests for HeaderDemoBadge.
 *
 * Scope:
 * - Renders a DEMO indicator when the user is on a demo account.
 * - Ensures the badge uses the expected visual variant (MUI Chip styling).
 *
 * Out of scope:
 * - Click interactions (if any)
 * - Routing/authentication logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HeaderDemoBadge from '../../../app/layout/header/HeaderDemoBadge';

/**
 * i18n mock:
 * Return default translation values to keep tests independent of translation JSON files.
 */
const mockUseTranslation = vi.hoisted(() => vi.fn());
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('HeaderDemoBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
    });
  });

  function renderBadge(isDemo: boolean) {
    return render(<HeaderDemoBadge isDemo={isDemo} />);
  }

  describe('Demo mode active', () => {
    it('renders the DEMO badge when isDemo=true', () => {
      // Primary user-facing contract: demo accounts must be clearly marked.
      renderBadge(true);

      expect(screen.getByText('DEMO')).toBeInTheDocument();
    });

    it('renders as a warning-colored, outlined MUI Chip', () => {
      // Visual contract: prominent but non-blocking badge styling.
      // Note: These assertions intentionally couple to MUI classnames.
      const { container } = renderBadge(true);

      expect(container.querySelector('.MuiChip-colorWarning')).toBeInTheDocument();
      expect(container.querySelector('.MuiChip-outlined')).toBeInTheDocument();
    });
  });

  describe('Demo mode inactive', () => {
    it('renders nothing when isDemo=false', () => {
      // Ensures the badge does not occupy layout space for non-demo users.
      const { container } = renderBadge(false);

      expect(container.firstChild).toBeNull();
    });

    it('does not render the DEMO label when isDemo=false', () => {
      // Defensive assertion for consumer-facing text.
      renderBadge(false);

      expect(screen.queryByText('DEMO')).not.toBeInTheDocument();
    });
  });

  describe('Prop behavior', () => {
    it('toggles visibility when isDemo changes', () => {
      // Guards against stale props in memoized components.
      const { rerender } = renderBadge(false);
      expect(screen.queryByText('DEMO')).not.toBeInTheDocument();

      rerender(<HeaderDemoBadge isDemo={true} />);
      expect(screen.getByText('DEMO')).toBeInTheDocument();
    });
  });

  describe('Translation integration', () => {
    it('renders the default demo badge label from i18n', () => {
      // Translation mock returns the default value ("DEMO").
      renderBadge(true);

      expect(screen.getByText('DEMO')).toBeInTheDocument();
    });
  });
});
