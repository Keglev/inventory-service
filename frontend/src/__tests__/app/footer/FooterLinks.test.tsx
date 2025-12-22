/**
 * @file FooterLinks.test.tsx
 * @module __tests__/app/footer/FooterLinks
 * @description Tests for footer support and documentation links component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FooterLinks from '../../../app/footer/FooterLinks';

// Hoisted mock
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('FooterLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders section title', () => {
    render(<FooterLinks />);
    expect(screen.getByText('Support & Docs')).toBeInTheDocument();
  });

  it('renders documentation link', () => {
    render(<FooterLinks />);
    const link = screen.getByText('Documentation');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#');
  });

  it('renders API reference link', () => {
    render(<FooterLinks />);
    const link = screen.getByText('API Reference');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#');
  });

  it('renders release notes link', () => {
    render(<FooterLinks />);
    const link = screen.getByText('Release Notes');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#');
  });

  it('renders contact support link', () => {
    render(<FooterLinks />);
    const link = screen.getByText('Contact Support');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'mailto:support@smartsupplypro.com');
  });

  it('renders all four links', () => {
    render(<FooterLinks />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
  });

  it('uses translations for section title', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => defaultValue);
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<FooterLinks />);

    expect(mockT).toHaveBeenCalledWith('footer:section.support', 'Support & Docs');
  });

  it('uses translations for link labels', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => defaultValue);
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<FooterLinks />);

    expect(mockT).toHaveBeenCalledWith('footer:support.documentation', 'Documentation');
    expect(mockT).toHaveBeenCalledWith('footer:support.apiRef', 'API Reference');
    expect(mockT).toHaveBeenCalledWith('footer:support.releaseNotes', 'Release Notes');
    expect(mockT).toHaveBeenCalledWith('footer:support.contact', 'Contact Support');
  });
});
