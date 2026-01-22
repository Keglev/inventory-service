/**
 * @file FooterLegal.test.tsx
 * @module __tests__/app/footer
 *
 * @description
 * Unit tests for <FooterLegal /> (legal + build metadata section shown in the footer).
 *
 * Test strategy:
 * - Verify core static content (section title, copyright).
 * - Verify metadata rendering (version, build id, environment).
 * - Verify that translation keys are requested (i18n wiring), without coupling tests
 *   to real translation catalogs.
 *
 * Notes:
 * - We mock `react-i18next` to keep tests deterministic and avoid loading i18n resources.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FooterLegal from '../../../app/footer/FooterLegal';

// -----------------------------------------------------------------------------
// i18n mock
// -----------------------------------------------------------------------------
// Hoisted so the mock function exists before `vi.mock()` factory executes.
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type FooterLegalProps = {
  appVersion: string;
  buildId: string;
  environment: string;
};

describe('FooterLegal', () => {
  const defaultProps: FooterLegalProps = {
    appVersion: '1.0.0',
    buildId: '4a9c12f',
    environment: 'Production (Koyeb)',
  };

  /**
   * Arrange helper:
   * - sets the default hook return (unless overwritten in a specific test)
   * - renders the component with default props + overrides
   *
   * Keeps tests short and readable while maintaining deterministic state.
   */
  const arrange = (props?: Partial<FooterLegalProps>) =>
    render(<FooterLegal {...defaultProps} {...props} />);

  beforeEach(() => {
    vi.clearAllMocks();

    // Deterministic translation stub: return `defaultValue` so text assertions remain stable.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering: section structure + static legal text
  // ---------------------------------------------------------------------------
  it('renders the legal section title', () => {
    // Ensures the user-visible "Legal & Meta" section is present.
    arrange();
    expect(screen.getByText('Legal & Meta')).toBeInTheDocument();
  });

  it('renders the copyright notice', () => {
    // Covers the portfolio footer legal baseline (year + rights notice).
    arrange();
    expect(screen.getByText(/© 2025 Smart Supply Pro/)).toBeInTheDocument();
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Rendering: metadata (version/build/environment)
  // ---------------------------------------------------------------------------
  it('renders version information', () => {
    arrange({ appVersion: '1.0.0' });
    expect(screen.getByText(/Version.*1\.0\.0/)).toBeInTheDocument();
  });

  it('renders build id information', () => {
    arrange({ buildId: '4a9c12f' });
    expect(screen.getByText(/Build.*4a9c12f/)).toBeInTheDocument();
  });

  it('renders environment information', () => {
    arrange({ environment: 'Production (Koyeb)' });
    expect(screen.getByText(/Environment.*Production \(Koyeb\)/)).toBeInTheDocument();
  });

  it('renders custom version values (config-driven)', () => {
    // Demonstrates the component is not hard-coded to a specific release.
    arrange({ appVersion: '2.5.3' });
    expect(screen.getByText(/Version.*2\.5\.3/)).toBeInTheDocument();
  });

  it('renders custom build id values (config-driven)', () => {
    arrange({ buildId: 'xyz789' });
    expect(screen.getByText(/Build.*xyz789/)).toBeInTheDocument();
  });

  it('renders custom environment values (config-driven)', () => {
    arrange({ environment: 'Staging' });
    expect(screen.getByText(/Environment.*Staging/)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // i18n wiring: verifies translation keys are requested
  // ---------------------------------------------------------------------------
  it('requests translations for labels', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => defaultValue);

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange();

    // Verifies the component is connected to the correct translation namespace/keys.
    expect(mockT).toHaveBeenCalledWith('footer:section.legal', 'Legal & Meta');
    expect(mockT).toHaveBeenCalledWith('footer:legal.rights', 'All rights reserved');
    expect(mockT).toHaveBeenCalledWith('footer:meta.version', 'Version');
    expect(mockT).toHaveBeenCalledWith('footer:meta.build', 'Build');
    expect(mockT).toHaveBeenCalledWith('footer:meta.environment', 'Environment');
  });
});
