/**
 * @file FooterMetaInfo.test.tsx
 * @module __tests__/app/footer
 *
 * @description
 * Unit tests for <FooterMetaInfo /> — compact footer metadata strip.
 *
 * Test strategy:
 * - Verify that the component renders the expected "meta" items:
 *   version, build id, environment, language/region indicator, and demo notice.
 * - Verify i18n wiring by asserting translation keys are requested.
 *
 * Notes:
 * - We keep i18n mocked to prevent test coupling to translation files.
 * - Assertions focus on user-visible content and stable strings.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FooterMetaInfo from '../../../app/footer/FooterMetaInfo';

// -----------------------------------------------------------------------------
// i18n mock
// -----------------------------------------------------------------------------
// Hoisted so the function exists before vi.mock factory evaluation.
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

// Local prop type for the component under test (avoids importing app internals).
type FooterMetaInfoProps = {
  appVersion: string;
  buildId: string;
  environment: string;
  currentLanguage: string;
  region: string;
};

describe('FooterMetaInfo', () => {
  const defaultProps: FooterMetaInfoProps = {
    appVersion: '1.0.0',
    buildId: '4a9c12f',
    environment: 'Production (Koyeb)',
    currentLanguage: 'EN',
    region: 'DE',
  };

  /**
   * Arrange helper:
   * - Reduces repetition and keeps tests focused on intent.
   * - Supports small scenario changes via partial prop overrides.
   */
  const arrange = (props?: Partial<FooterMetaInfoProps>) =>
    render(<FooterMetaInfo {...defaultProps} {...props} />);

  beforeEach(() => {
    vi.clearAllMocks();

    // Deterministic translation stub: return `defaultValue` so assertions remain stable.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering: baseline content
  // ---------------------------------------------------------------------------
  it('renders the copyright notice', () => {
    // Ensures the component consistently communicates legal ownership in the compact strip.
    arrange();
    expect(screen.getByText(/© 2025 Smart Supply Pro/)).toBeInTheDocument();
  });

  it('renders the application version', () => {
    // Version formatting often changes over time; keep this as a stable regression check.
    arrange({ appVersion: '1.0.0' });
    expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
  });

  it('renders the build identifier', () => {
    arrange({ buildId: '4a9c12f' });
    expect(screen.getByText(/Build 4a9c12f/)).toBeInTheDocument();
  });

  it('renders the environment label', () => {
    arrange({ environment: 'Production (Koyeb)' });
    expect(screen.getByText(/Production \(Koyeb\)/)).toBeInTheDocument();
  });

  it('renders the demo-data notice', () => {
    // Portfolio apps frequently use demo/test data—this makes it explicit to recruiters/users.
    arrange();
    expect(screen.getByText(/Demo data only/)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Rendering: language/region indicator
  // ---------------------------------------------------------------------------
  it('renders the language-region tag (default)', () => {
    arrange({ currentLanguage: 'EN', region: 'DE' });
    expect(screen.getByText('EN-DE')).toBeInTheDocument();
  });

  it('renders the language-region tag with a different language', () => {
    arrange({ currentLanguage: 'DE', region: 'DE' });
    expect(screen.getByText('DE-DE')).toBeInTheDocument();
  });

  it('renders the language-region tag with a different region', () => {
    arrange({ currentLanguage: 'EN', region: 'US' });
    expect(screen.getByText('EN-US')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // i18n wiring: verifies translation keys are requested
  // ---------------------------------------------------------------------------
  it('requests translations for metadata labels', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => defaultValue);
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange();

    // Labels that typically come from i18n catalogs:
    // - "Build" prefix
    // - "Demo data only" notice
    expect(mockT).toHaveBeenCalledWith('footer:meta.build', 'Build');
    expect(mockT).toHaveBeenCalledWith('footer:meta.demoData', 'Demo data only');
  });
});
