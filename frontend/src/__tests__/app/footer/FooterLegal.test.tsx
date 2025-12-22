/**
 * @file FooterLegal.test.tsx
 * @module __tests__/app/footer/FooterLegal
 * @description Tests for footer legal information component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FooterLegal from '../../../app/footer/FooterLegal';

// Hoisted mock
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('FooterLegal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders section title', () => {
    render(
      <FooterLegal
        appVersion="1.0.0"
        buildId="4a9c12f"
        environment="Production (Koyeb)"
      />
    );
    expect(screen.getByText('Legal & Meta')).toBeInTheDocument();
  });

  it('renders copyright notice', () => {
    render(
      <FooterLegal
        appVersion="1.0.0"
        buildId="4a9c12f"
        environment="Production (Koyeb)"
      />
    );
    expect(screen.getByText(/© 2025 Smart Supply Pro/)).toBeInTheDocument();
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
  });

  it('renders version information', () => {
    render(
      <FooterLegal
        appVersion="1.0.0"
        buildId="4a9c12f"
        environment="Production (Koyeb)"
      />
    );
    expect(screen.getByText(/Version.*1\.0\.0/)).toBeInTheDocument();
  });

  it('renders build ID', () => {
    render(
      <FooterLegal
        appVersion="1.0.0"
        buildId="4a9c12f"
        environment="Production (Koyeb)"
      />
    );
    expect(screen.getByText(/Build.*4a9c12f/)).toBeInTheDocument();
  });

  it('renders environment information', () => {
    render(
      <FooterLegal
        appVersion="1.0.0"
        buildId="4a9c12f"
        environment="Production (Koyeb)"
      />
    );
    expect(screen.getByText(/Environment.*Production \(Koyeb\)/)).toBeInTheDocument();
  });

  it('renders with custom version', () => {
    render(
      <FooterLegal
        appVersion="2.5.3"
        buildId="abc123"
        environment="Development"
      />
    );
    expect(screen.getByText(/Version.*2\.5\.3/)).toBeInTheDocument();
  });

  it('renders with custom build ID', () => {
    render(
      <FooterLegal
        appVersion="1.0.0"
        buildId="xyz789"
        environment="Testing"
      />
    );
    expect(screen.getByText(/Build.*xyz789/)).toBeInTheDocument();
  });

  it('renders with custom environment', () => {
    render(
      <FooterLegal
        appVersion="1.0.0"
        buildId="4a9c12f"
        environment="Staging"
      />
    );
    expect(screen.getByText(/Environment.*Staging/)).toBeInTheDocument();
  });

  it('uses translations for labels', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => defaultValue);
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(
      <FooterLegal
        appVersion="1.0.0"
        buildId="4a9c12f"
        environment="Production (Koyeb)"
      />
    );

    expect(mockT).toHaveBeenCalledWith('footer:section.legal', 'Legal & Meta');
    expect(mockT).toHaveBeenCalledWith('footer:legal.rights', 'All rights reserved');
    expect(mockT).toHaveBeenCalledWith('footer:meta.version', 'Version');
    expect(mockT).toHaveBeenCalledWith('footer:meta.build', 'Build');
    expect(mockT).toHaveBeenCalledWith('footer:meta.environment', 'Environment');
  });
});
