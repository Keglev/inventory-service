/**
 * @file FooterLinks.test.tsx
 * @module __tests__/app/footer
 *
 * @description
 * Unit tests for <FooterLinks /> — the footer section that exposes support/documentation links.
 *
 * Test strategy:
 * - Validate that all expected links render with correct accessible names and destinations.
 * - Validate i18n integration by asserting translation keys are requested (without loading catalogs).
 *
 * Out of scope:
 * - Styling, layout, and icon rendering (covered by visual checks or e2e).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FooterLinks from '../../../app/footer/FooterLinks';

// -----------------------------------------------------------------------------
// i18n mock
// -----------------------------------------------------------------------------
// Hoisted so it can be referenced safely inside vi.mock factory.
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('FooterLinks', () => {
  /**
   * Arrange helper:
   * Centralizes render logic so tests focus on intent rather than setup noise.
   */
  const arrange = () => render(<FooterLinks />);

  /**
   * Convenience getter for links by their accessible name.
   * This asserts what users (and assistive technologies) can actually perceive.
   */
  const getLink = (name: string) => screen.getByRole('link', { name });

  beforeEach(() => {
    vi.clearAllMocks();

    // Deterministic translation stub: return `defaultValue` to keep assertions stable.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering: section + links
  // ---------------------------------------------------------------------------
  it('renders the section title', () => {
    // Ensures the user-facing section heading is present.
    arrange();
    expect(screen.getByText('Support & Docs')).toBeInTheDocument();
  });

  it('renders the documentation link (placeholder target)', () => {
    arrange();
    const link = getLink('Documentation');
    expect(link).toHaveAttribute('href', '#');
  });

  it('renders the API reference link (placeholder target)', () => {
    arrange();
    const link = getLink('API Reference');
    expect(link).toHaveAttribute('href', '#');
  });

  it('renders the release notes link (placeholder target)', () => {
    arrange();
    const link = getLink('Release Notes');
    expect(link).toHaveAttribute('href', '#');
  });

  it('renders the contact support mailto link', () => {
    arrange();
    const link = getLink('Contact Support');
    expect(link).toHaveAttribute('href', 'mailto:support@smartsupplypro.com');
  });

  it('renders exactly four links', () => {
    // Guards against accidental addition/removal of footer navigation entries.
    arrange();
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  // ---------------------------------------------------------------------------
  // i18n wiring: verifies translation keys are requested
  // ---------------------------------------------------------------------------
  it('requests translation for the section title', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => defaultValue);
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange();

    // Verifies the key used by the component rather than the translated output.
    expect(mockT).toHaveBeenCalledWith('footer:section.support', 'Support & Docs');
  });

  it('requests translations for all link labels', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => defaultValue);
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange();

    expect(mockT).toHaveBeenCalledWith('footer:support.documentation', 'Documentation');
    expect(mockT).toHaveBeenCalledWith('footer:support.apiRef', 'API Reference');
    expect(mockT).toHaveBeenCalledWith('footer:support.releaseNotes', 'Release Notes');
    expect(mockT).toHaveBeenCalledWith('footer:support.contact', 'Contact Support');
  });
});
