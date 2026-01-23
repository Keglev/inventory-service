/**
 * @file HelpDocsMenuSection.test.tsx
 * @module __tests__/app/HamburgerMenu
 *
 * @description
 * Unit tests for <HelpDocsMenuSection /> — verifies that help/documentation links are rendered
 * with the correct destinations and secure external-link attributes.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HelpDocsMenuSection from '../../../app/HamburgerMenu/HelpDocsMenuSection';

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('HelpDocsMenuSection', () => {
  const arrange = () => render(<HelpDocsMenuSection />);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders section title', () => {
    arrange();
    expect(screen.getByText('Hilfe & Dokumentation / Help & Docs')).toBeInTheDocument();
  });

  it('renders the GitHub repository link with correct URL', () => {
    arrange();

    const link = screen.getByRole('link', { name: 'GitHub Repository' });
    expect(link).toHaveAttribute('href', 'https://github.com/Keglev/inventory-service');
  });

  it('renders the OpenAPI docs link with correct URL', () => {
    arrange();

    const link = screen.getByRole('link', { name: 'Open API Docs' });
    expect(link).toHaveAttribute('href', '/docs/api');
  });

  it('renders the frontend docs link with correct URL', () => {
    arrange();

    const link = screen.getByRole('link', { name: 'Frontend Docs' });
    expect(link).toHaveAttribute('href', '/docs/frontend');
  });

  it('opens all links in a new tab with safe rel attributes', () => {
    arrange();

    // Enterprise security baseline for external targets: prevent reverse tabnabbing.
    const links = screen.getAllByRole('link');
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('renders a link list with exactly three entries', () => {
    arrange();
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('renders an external-link icon for each link (non-brittle check)', () => {
    const { container } = arrange();

    // We avoid hard-coding exact SVG counts (can change with MUI internals),
    // but we still verify icons are present for the link list.
    const svgIcons = container.querySelectorAll('svg');
    expect(svgIcons.length).toBeGreaterThanOrEqual(3);
  });

  it('uses translations for labels when provided', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'help.title') return 'Aide';
      if (key === 'help.github') return 'Dépôt GitHub';
      if (key === 'help.apiDocs') return 'Docs API';
      if (key === 'help.frontendDocs') return 'Docs Frontend';
      return defaultValue;
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange();

    expect(screen.getByText('Aide')).toBeInTheDocument();
    expect(screen.getByText('Dépôt GitHub')).toBeInTheDocument();
    expect(screen.getByText('Docs API')).toBeInTheDocument();
    expect(screen.getByText('Docs Frontend')).toBeInTheDocument();

    // Optional: ensures wiring calls translation keys (helps catch regressions).
    expect(mockT).toHaveBeenCalledWith('help.title', expect.any(String));
    expect(mockT).toHaveBeenCalledWith('help.github', expect.any(String));
    expect(mockT).toHaveBeenCalledWith('help.apiDocs', expect.any(String));
    expect(mockT).toHaveBeenCalledWith('help.frontendDocs', expect.any(String));
  });
});
