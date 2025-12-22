/**
 * @file AppFooter.test.tsx
 * @module __tests__/app/footer/AppFooter
 * @description Tests for main application footer component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppFooter from '../../../app/footer/AppFooter';

// Hoisted mocks
const mockUseTranslation = vi.hoisted(() => vi.fn());
const mockUseFooterState = vi.hoisted(() => vi.fn());

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

// Mock useFooterState hook
vi.mock('../../../app/footer/useFooterState', () => ({
  useFooterState: mockUseFooterState,
}));

describe('AppFooter', () => {
  const mockToggleDetails = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
    mockUseFooterState.mockReturnValue({
      detailsOpen: false,
      toggleDetails: mockToggleDetails,
      health: { status: 'online', responseTime: 125, database: 'online' },
      config: {
        appVersion: '1.0.0',
        buildId: '4a9c12f',
        environment: 'Production (Koyeb)',
        currentLanguage: 'EN',
        region: 'DE',
      },
    });
  });

  it('renders footer element', () => {
    const { container } = render(<AppFooter />);
    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('renders compact status bar always visible', () => {
    render(<AppFooter />);
    expect(screen.getByText(/© 2025 Smart Supply Pro/)).toBeInTheDocument();
    expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
  });

  it('renders expand button', () => {
    render(<AppFooter />);
    const button = screen.getByLabelText('Footer details');
    expect(button).toBeInTheDocument();
  });

  it('calls toggleDetails when expand button clicked', async () => {
    const user = userEvent.setup();
    render(<AppFooter />);

    const button = screen.getByLabelText('Footer details');
    await user.click(button);

    expect(mockToggleDetails).toHaveBeenCalledTimes(1);
  });

  it('does not render details panel when closed', () => {
    mockUseFooterState.mockReturnValue({
      detailsOpen: false,
      toggleDetails: mockToggleDetails,
      health: { status: 'online', responseTime: 125, database: 'online' },
      config: {
        appVersion: '1.0.0',
        buildId: '4a9c12f',
        environment: 'Production (Koyeb)',
        currentLanguage: 'EN',
        region: 'DE',
      },
    });

    render(<AppFooter />);
    expect(screen.queryByText('Legal & Meta')).not.toBeInTheDocument();
  });

  it('renders details panel when open', () => {
    mockUseFooterState.mockReturnValue({
      detailsOpen: true,
      toggleDetails: mockToggleDetails,
      health: { status: 'online', responseTime: 125, database: 'online' },
      config: {
        appVersion: '1.0.0',
        buildId: '4a9c12f',
        environment: 'Production (Koyeb)',
        currentLanguage: 'EN',
        region: 'DE',
      },
    });

    render(<AppFooter />);
    expect(screen.getByText('Legal & Meta')).toBeInTheDocument();
  });

  it('renders privacy notice when details open', () => {
    mockUseFooterState.mockReturnValue({
      detailsOpen: true,
      toggleDetails: mockToggleDetails,
      health: { status: 'online', responseTime: 125, database: 'online' },
      config: {
        appVersion: '1.0.0',
        buildId: '4a9c12f',
        environment: 'Production (Koyeb)',
        currentLanguage: 'EN',
        region: 'DE',
      },
    });

    render(<AppFooter />);
    expect(screen.getByText(/portfolio showcases a fictional/)).toBeInTheDocument();
  });

  it('renders health status in compact bar', () => {
    render(<AppFooter />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders offline health status', () => {
    mockUseFooterState.mockReturnValue({
      detailsOpen: false,
      toggleDetails: mockToggleDetails,
      health: { status: 'offline', responseTime: 0, database: 'offline' },
      config: {
        appVersion: '1.0.0',
        buildId: '4a9c12f',
        environment: 'Production (Koyeb)',
        currentLanguage: 'EN',
        region: 'DE',
      },
    });

    render(<AppFooter />);
    const offlineElements = screen.getAllByText('Offline');
    expect(offlineElements.length).toBeGreaterThan(0);
  });

  it('passes config to FooterMetaInfo', () => {
    render(<AppFooter />);
    expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
    expect(screen.getByText(/Build 4a9c12f/)).toBeInTheDocument();
    expect(screen.getByText('EN-DE')).toBeInTheDocument();
  });

  it('uses translations for privacy notice', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => defaultValue);
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });
    mockUseFooterState.mockReturnValue({
      detailsOpen: true,
      toggleDetails: mockToggleDetails,
      health: { status: 'online', responseTime: 125, database: 'online' },
      config: {
        appVersion: '1.0.0',
        buildId: '4a9c12f',
        environment: 'Production (Koyeb)',
        currentLanguage: 'EN',
        region: 'DE',
      },
    });

    render(<AppFooter />);

    expect(mockT).toHaveBeenCalledWith(
      'footer:privacy.notice',
      expect.stringContaining('portfolio showcases')
    );
  });
});
