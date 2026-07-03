/**
 * @file FooterLinks.test.tsx
 * @module tests/app/footer/FooterLinks
 * @what_is_under_test FooterLinks
 * @responsibility
 * Guarantees the inline footer link row: link targets, new-tab semantics for
 * external docs, and i18n key wiring for all labels.
 * @out_of_scope
 * Footer layout/composition (AppFooter suite); translation content itself.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FooterLinks from '../../../app/footer/FooterLinks';

// -----------------------------------------------------------------------------
// i18n mock
// -----------------------------------------------------------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('FooterLinks', () => {
  const arrange = () => render(<FooterLinks />);

  const getLink = (name: string) => screen.getByRole('link', { name });

  beforeEach(() => {
    vi.clearAllMocks();

    // Deterministic translation stub: return defaultValue to keep assertions stable.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
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

  it('renders the contact support mailto link', () => {
    arrange();
    const link = getLink('Contact Support');
    expect(link).toHaveAttribute('href', 'mailto:support@smartsupplypro.com');
    expect(getLink('Contact Support')).not.toHaveAttribute('target');
  });

  it('renders exactly three links', () => {
    arrange();
    expect(screen.getAllByRole('link')).toHaveLength(3);
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
    expect(mockT).toHaveBeenCalledWith('footer:support.contact', 'Contact Support');
  });
});
