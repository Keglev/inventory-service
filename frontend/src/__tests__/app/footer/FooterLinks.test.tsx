/**
 * @file FooterLinks.test.tsx
 * @module tests/app/footer/FooterLinks
 * @description Contract tests for FooterLinks.
 *
 * Contract under test:
 * - Guarantees the inline footer link row: link targets, new-tab
 *   semantics for external docs, internal SPA routes for the legal
 *   pages, and i18n key wiring.
 *
 * Out of scope:
 * - Footer layout/composition (AppFooter suite); translation content
 *   itself; legal page rendering (pages/legal suites).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FooterLinks from '../../../app/footer/FooterLinks';
import { tEn } from '../../test/i18nEn';

// -----------------------------------------------------------------------------
// i18n mock
// -----------------------------------------------------------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('FooterLinks', () => {
  // Internal legal links render via react-router Link and need a router context.
  const arrange = () =>
    render(
      <MemoryRouter>
        <FooterLinks />
      </MemoryRouter>
    );

  const getLink = (name: string) => screen.getByRole('link', { name });

  beforeEach(() => {
    vi.clearAllMocks();

    // Deterministic translation stub: return defaultValue to keep assertions stable.
    mockUseTranslation.mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders the documentation link to the published docs in a new tab', () => {
    arrange();
    const link = getLink('Documentation');
    expect(link).toHaveAttribute('href', 'https://keglev.github.io/inventory-service/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the API reference link to the ReDoc page in a new tab', () => {
    arrange();
    const link = getLink('API Reference');
    expect(link).toHaveAttribute('href', 'https://keglev.github.io/inventory-service/backend/api/index.html');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the frontend docs link to the published frontend docs in a new tab', () => {
    arrange();
    const link = getLink('Frontend Docs');
    expect(link).toHaveAttribute('href', 'https://keglev.github.io/inventory-service/frontend/architecture/overview.html');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the release notes link to the GitHub releases page in a new tab', () => {
    arrange();
    const link = getLink('Release Notes');
    expect(link).toHaveAttribute('href', 'https://github.com/Keglev/inventory-service/releases');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the contact support mailto link to the maintainer address', () => {
    arrange();
    const link = getLink('Contact Support');
    expect(link).toHaveAttribute('href', 'mailto:carlos.keglevich@gmail.com');
    expect(link).not.toHaveAttribute('target');
  });

  it('renders the Impressum link as an internal same-tab route', () => {
    arrange();
    const link = getLink('Legal Notice');
    expect(link).toHaveAttribute('href', '/impressum');
    expect(link).not.toHaveAttribute('target');
  });

  it('renders the privacy policy link as an internal same-tab route', () => {
    arrange();
    const link = getLink('Privacy Policy');
    expect(link).toHaveAttribute('href', '/datenschutz');
    expect(link).not.toHaveAttribute('target');
  });

  it('renders exactly seven links', () => {
    arrange();
    expect(screen.getAllByRole('link')).toHaveLength(7);
  });

  it('requests translations for all link labels', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => defaultValue);
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange();

    expect(mockT).toHaveBeenCalledWith('footer:support.documentation');
    expect(mockT).toHaveBeenCalledWith('footer:support.apiRef');
    expect(mockT).toHaveBeenCalledWith('footer:support.contact');
    expect(mockT).toHaveBeenCalledWith('footer:legal.impressum');
    expect(mockT).toHaveBeenCalledWith('footer:legal.privacy');
  });
});
