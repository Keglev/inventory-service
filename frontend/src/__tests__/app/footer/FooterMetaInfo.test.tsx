/**
 * @file FooterMetaInfo.test.tsx
 * @module __tests__/app/footer
 *
 * @description
 * Unit tests for <FooterMetaInfo /> — compact footer metadata strip.
 *
 * Test strategy:
 * - Verify the compact line (FW5 fork 3): current year, version, the first 10
 *   characters of the build id (full id in the title), demo notice; no
 *   environment and no language-region tag.
 * - Verify i18n wiring by asserting translation keys are requested.
 *
 * Notes:
 * - We keep i18n mocked to prevent test coupling to translation files.
 * - Assertions focus on user-visible content and stable strings.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FooterMetaInfo from '@/app/footer/FooterMetaInfo';
import { tEn } from '@/__tests__/test/i18nEn';

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
};

describe('FooterMetaInfo', () => {
  const defaultProps: FooterMetaInfoProps = {
    appVersion: '1.0.0',
    buildId: '4a9c12f',
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
      t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
      i18n: { changeLanguage: vi.fn() },
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering: baseline content
  // ---------------------------------------------------------------------------
  it('renders the copyright notice with the current year', () => {
    // The year follows the clock instead of a literal (it read 2025 in 2026).
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2031-03-01T12:00:00Z'));
    arrange();
    expect(screen.getByText(/© 2031 Smart Supply Pro/)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('renders the application version', () => {
    // Version formatting often changes over time; keep this as a stable regression check.
    arrange({ appVersion: '1.0.0' });
    expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
  });

  it('renders the build identifier', () => {
    const { container } = arrange({ buildId: '4a9c12f' });
    expect(container.textContent).toContain('Build 4a9c12f');
  });

  it('shows the first 10 characters of a full commit hash and keeps the full hash in the title', () => {
    const fullId = 'b5fb25c0584db5004356410c5dc05348b7f17ff3';
    arrange({ buildId: fullId });

    const shortId = screen.getByText('b5fb25c058');
    expect(shortId).toHaveAttribute('title', fullId);
    expect(screen.queryByText(new RegExp(fullId))).not.toBeInTheDocument();
  });

  it('renders no environment and no language-region tag', () => {
    // Both moved out of the footer line (About dialog, settings dialog).
    const { container } = arrange();
    expect(screen.getByText(/Demo data only/)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Production|Koyeb|EN-DE|DE-DE/);
  });

  it('renders the demo-data notice', () => {
    // Portfolio apps frequently use demo/test data—this makes it explicit to recruiters/users.
    arrange();
    expect(screen.getByText(/Demo data only/)).toBeInTheDocument();
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
    expect(mockT).toHaveBeenCalledWith('footer:meta.build');
    expect(mockT).toHaveBeenCalledWith('footer:meta.demoData');
  });
});
