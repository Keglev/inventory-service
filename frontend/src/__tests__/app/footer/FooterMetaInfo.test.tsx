/**
 * @file FooterMetaInfo.test.tsx
 * @module __tests__/app/footer/FooterMetaInfo
 * @description Tests for footer metadata information component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FooterMetaInfo from '../../../app/footer/FooterMetaInfo';

// Hoisted mock
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('FooterMetaInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders copyright notice', () => {
    render(
      <FooterMetaInfo
        appVersion="1.0.0"
        buildId="4a9c12f"
        environment="Production (Koyeb)"
        currentLanguage="EN"
        region="DE"
      />
    );
    expect(screen.getByText(/© 2025 Smart Supply Pro/)).toBeInTheDocument();
  });

  it('renders version information', () => {
    render(
      <FooterMetaInfo
        appVersion="1.0.0"
        buildId="4a9c12f"
        environment="Production (Koyeb)"
        currentLanguage="EN"
        region="DE"
      />
    );
    expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
  });

  it('renders build ID', () => {
    render(
      <FooterMetaInfo
        appVersion="1.0.0"
        buildId="4a9c12f"
        environment="Production (Koyeb)"
        currentLanguage="EN"
        region="DE"
      />
    );
    expect(screen.getByText(/Build 4a9c12f/)).toBeInTheDocument();
  });

  it('renders environment information', () => {
    render(
      <FooterMetaInfo
        appVersion="1.0.0"
        buildId="4a9c12f"
        environment="Production (Koyeb)"
        currentLanguage="EN"
        region="DE"
      />
    );
    expect(screen.getByText(/Production \(Koyeb\)/)).toBeInTheDocument();
  });

  it('renders demo data notice', () => {
    render(
      <FooterMetaInfo
        appVersion="1.0.0"
        buildId="4a9c12f"
        environment="Production (Koyeb)"
        currentLanguage="EN"
        region="DE"
      />
    );
    expect(screen.getByText(/Demo data only/)).toBeInTheDocument();
  });

  it('renders language and region', () => {
    render(
      <FooterMetaInfo
        appVersion="1.0.0"
        buildId="4a9c12f"
        environment="Production (Koyeb)"
        currentLanguage="EN"
        region="DE"
      />
    );
    expect(screen.getByText('EN-DE')).toBeInTheDocument();
  });

  it('renders with different language', () => {
    render(
      <FooterMetaInfo
        appVersion="1.0.0"
        buildId="4a9c12f"
        environment="Production (Koyeb)"
        currentLanguage="DE"
        region="DE"
      />
    );
    expect(screen.getByText('DE-DE')).toBeInTheDocument();
  });

  it('renders with different region', () => {
    render(
      <FooterMetaInfo
        appVersion="1.0.0"
        buildId="4a9c12f"
        environment="Production (Koyeb)"
        currentLanguage="EN"
        region="US"
      />
    );
    expect(screen.getByText('EN-US')).toBeInTheDocument();
  });

  it('uses translations for labels', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => defaultValue);
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(
      <FooterMetaInfo
        appVersion="1.0.0"
        buildId="4a9c12f"
        environment="Production (Koyeb)"
        currentLanguage="EN"
        region="DE"
      />
    );

    expect(mockT).toHaveBeenCalledWith('footer:meta.build', 'Build');
    expect(mockT).toHaveBeenCalledWith('footer:meta.demoData', 'Demo data only');
  });
});
