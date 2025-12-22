/**
 * @file HelpDocsMenuSection.test.tsx
 * @module __tests__/app/HamburgerMenu/HelpDocsMenuSection
 * @description Tests for help docs menu section component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HelpDocsMenuSection from '../../../app/HamburgerMenu/HelpDocsMenuSection';

// Hoisted mocks
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('HelpDocsMenuSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders help docs section title', () => {
    render(<HelpDocsMenuSection />);
    expect(screen.getByText('Hilfe & Dokumentation / Help & Docs')).toBeInTheDocument();
  });

  it('renders GitHub repository link', () => {
    render(<HelpDocsMenuSection />);
    const link = screen.getByText('GitHub Repository');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', 'https://github.com/Keglev/inventory-service');
  });

  it('renders API Docs link', () => {
    render(<HelpDocsMenuSection />);
    const link = screen.getByText('Open API Docs');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/docs/api');
  });

  it('renders Frontend Docs link', () => {
    render(<HelpDocsMenuSection />);
    const link = screen.getByText('Frontend Docs');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/docs/frontend');
  });

  it('opens links in new tab', () => {
    render(<HelpDocsMenuSection />);
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('renders external link icons', () => {
    const { container } = render(<HelpDocsMenuSection />);
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBe(3); // One icon per link
  });

  it('uses translations for labels', () => {
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

    render(<HelpDocsMenuSection />);
    
    expect(screen.getByText('Aide')).toBeInTheDocument();
    expect(screen.getByText('Dépôt GitHub')).toBeInTheDocument();
    expect(screen.getByText('Docs API')).toBeInTheDocument();
    expect(screen.getByText('Docs Frontend')).toBeInTheDocument();
  });

  it('renders all three documentation links', () => {
    render(<HelpDocsMenuSection />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
  });
});
