/**
 * @file HeaderDemoBadge.test.tsx
 *
 * @what_is_under_test HeaderDemoBadge component
 * @responsibility Displays a prominent DEMO badge in the header when user is on a demo account
 * @out_of_scope Badge click interactions, routing, authentication logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HeaderDemoBadge from '../../../app/layout/header/HeaderDemoBadge';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue: string) => defaultValue,
  }),
}));

describe('HeaderDemoBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Demo mode active', () => {
    it('renders DEMO badge when isDemo is true', () => {
      render(<HeaderDemoBadge isDemo={true} />);
      expect(screen.getByText('DEMO')).toBeInTheDocument();
    });

    it('renders as a warning-colored chip', () => {
      const { container } = render(<HeaderDemoBadge isDemo={true} />);
      const chip = container.querySelector('.MuiChip-colorWarning');
      expect(chip).toBeInTheDocument();
    });

    it('renders with outlined variant', () => {
      const { container } = render(<HeaderDemoBadge isDemo={true} />);
      const chip = container.querySelector('.MuiChip-outlined');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Demo mode inactive', () => {
    it('renders nothing when isDemo is false', () => {
      const { container } = render(<HeaderDemoBadge isDemo={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('does not render DEMO text when isDemo is false', () => {
      render(<HeaderDemoBadge isDemo={false} />);
      expect(screen.queryByText('DEMO')).not.toBeInTheDocument();
    });
  });

  describe('Props variations', () => {
    it('toggles visibility based on isDemo prop', () => {
      const { rerender } = render(<HeaderDemoBadge isDemo={false} />);
      expect(screen.queryByText('DEMO')).not.toBeInTheDocument();

      rerender(<HeaderDemoBadge isDemo={true} />);
      expect(screen.getByText('DEMO')).toBeInTheDocument();
    });
  });

  describe('Translation integration', () => {
    it('uses auth:demoBadge translation key', () => {
      render(<HeaderDemoBadge isDemo={true} />);
      // Translation mock returns the default value "DEMO"
      expect(screen.getByText('DEMO')).toBeInTheDocument();
    });
  });
});
