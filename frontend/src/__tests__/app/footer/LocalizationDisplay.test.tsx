/**
 * @file LocalizationDisplay.test.tsx
 * @module __tests__/app/footer
 *
 * @description
 * Unit tests for <LocalizationDisplay /> — shows current language + region in the footer.
 *
 * Test strategy:
 * - Verify the section title and the presence of both labels (Language, Region).
 * - Verify that provided values (currentLanguage, region) are rendered.
 * - Verify i18n wiring by asserting translation keys are requested.
 *
 * Notes:
 * - `react-i18next` is mocked to keep tests deterministic and independent of catalogs.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LocalizationDisplay from '../../../app/footer/LocalizationDisplay';

// -----------------------------------------------------------------------------
// i18n mock
// -----------------------------------------------------------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type LocalizationProps = {
  currentLanguage: string;
  region: string;
};

describe('LocalizationDisplay', () => {
  const defaultProps: LocalizationProps = {
    currentLanguage: 'EN',
    region: 'DE',
  };

  /**
   * Arrange helper: keeps test setup consistent and reduces duplication.
   */
  const arrange = (props?: Partial<LocalizationProps>) =>
    render(<LocalizationDisplay {...defaultProps} {...props} />);

  beforeEach(() => {
    vi.clearAllMocks();

    // Deterministic translation stub: return defaultValue for stable assertions.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering: structure and labels
  // ---------------------------------------------------------------------------
  it('renders the section title', () => {
    arrange();
    expect(screen.getByText('Language & Region')).toBeInTheDocument();
  });

  it('renders the language label', () => {
    // The label is expected to include a ":" separator in the UI.
    arrange();
    expect(screen.getByText(/Language.*:/)).toBeInTheDocument();
  });

  it('renders the region label', () => {
    arrange();
    expect(screen.getByText(/Region.*:/)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Rendering: values
  // ---------------------------------------------------------------------------
  it('renders the current language value', () => {
    arrange({ currentLanguage: 'EN' });
    expect(screen.getByText(/Language.*EN/)).toBeInTheDocument();
  });

  it('renders the current region value', () => {
    arrange({ region: 'DE' });
    expect(screen.getByText(/Region.*DE/)).toBeInTheDocument();
  });

  it('renders with German language', () => {
    arrange({ currentLanguage: 'DE' });
    expect(screen.getByText(/Language.*DE/)).toBeInTheDocument();
  });

  it('renders with a different region', () => {
    arrange({ region: 'US' });
    expect(screen.getByText(/Region.*US/)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // i18n wiring
  // ---------------------------------------------------------------------------
  it('requests translation for the section title', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => defaultValue);
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange();

    expect(mockT).toHaveBeenCalledWith('footer:section.localization', 'Language & Region');
  });

  it('requests translations for labels', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => defaultValue);
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange();

    expect(mockT).toHaveBeenCalledWith('footer:locale.language', 'Language');
    expect(mockT).toHaveBeenCalledWith('footer:locale.region', 'Region');
  });
});
