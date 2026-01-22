/**
 * @file AppFooter.test.tsx
 * @module app/footer
 *
 * @description
 * Unit tests for <AppFooter />.
 *
 * Test strategy:
 * - Verify key UI states (collapsed vs expanded) and user interaction (toggle).
 * - Mock i18n to keep tests deterministic and independent of translation catalogs.
 * - Mock useFooterState to drive scenarios without relying on runtime health/config.
 *
 * Out of scope:
 * - Styling / layout assertions (covered by visual review or e2e).
 * - Third-party component internals.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppFooter from '../../../app/footer/AppFooter';

// -----------------------------
// Mocks (hoisted so they are available to vi.mock factory)
// -----------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());
const mockUseFooterState = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

vi.mock('../../../app/footer/useFooterState', () => ({
  useFooterState: mockUseFooterState,
}));

// -----------------------------
// Local types for the mocked hook return
// (keeps tests strongly typed without importing app internals)
// -----------------------------
type FooterHealth = {
  status: 'online' | 'offline';
  responseTime: number;
  database: 'online' | 'offline';
};

type FooterConfig = {
  appVersion: string;
  buildId: string;
  environment: string;
  currentLanguage: string;
  region: string;
};

type FooterState = {
  detailsOpen: boolean;
  toggleDetails: () => void;
  health: FooterHealth;
  config: FooterConfig;
};

// Allows partial overrides including nested objects.
type FooterStateOverrides = Partial<Omit<FooterState, 'health' | 'config'>> & {
  health?: Partial<FooterHealth>;
  config?: Partial<FooterConfig>;
};

describe('AppFooter', () => {
  const mockToggleDetails = vi.fn();

  const makeState = (overrides: FooterStateOverrides = {}): FooterState => {
    const base: FooterState = {
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
    };

    return {
      ...base,
      ...overrides,
      health: { ...base.health, ...(overrides.health ?? {}) },
      config: { ...base.config, ...(overrides.config ?? {}) },
    };
  };

  const arrange = (overrides?: FooterStateOverrides) => {
    mockUseFooterState.mockReturnValue(makeState(overrides));
    return render(<AppFooter />);
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Deterministic translation stub: returns defaultValue.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });

    mockUseFooterState.mockReturnValue(makeState());
  });

  // -----------------------------
  // Rendering
  // -----------------------------
  it('renders a semantic footer landmark', () => {
    arrange();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('always renders the compact status bar', () => {
    arrange();
    expect(screen.getByText(/© 2025 Smart Supply Pro/)).toBeInTheDocument();
    expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
  });

  it('renders an expand/collapse control', () => {
    arrange();
    expect(screen.getByLabelText('Footer details')).toBeInTheDocument();
  });

  // -----------------------------
  // Interaction
  // -----------------------------
  it('calls toggleDetails when the control is clicked', async () => {
    const user = userEvent.setup();
    arrange();

    await user.click(screen.getByLabelText('Footer details'));
    expect(mockToggleDetails).toHaveBeenCalledTimes(1);
  });

  // -----------------------------
  // Details panel
  // -----------------------------
  it('does not render details panel when closed', () => {
    arrange({ detailsOpen: false });
    expect(screen.queryByText('Legal & Meta')).not.toBeInTheDocument();
  });

  it('renders details panel when open', () => {
    arrange({ detailsOpen: true });
    expect(screen.getByText('Legal & Meta')).toBeInTheDocument();
  });

  it('renders privacy notice when details are open', () => {
    arrange({ detailsOpen: true });
    expect(screen.getByText(/portfolio showcases a fictional/)).toBeInTheDocument();
  });

  // -----------------------------
  // Health + meta
  // -----------------------------
  it('renders online health status in compact bar', () => {
    arrange({ health: { status: 'online' } });
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders offline health status', () => {
    arrange({ health: { status: 'offline', responseTime: 0, database: 'offline' } });
    expect(screen.getAllByText('Offline').length).toBeGreaterThan(0);
  });

  it('renders config meta info', () => {
    arrange({
      config: { appVersion: '1.0.0', buildId: '4a9c12f', currentLanguage: 'EN', region: 'DE' },
    });

    expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
    expect(screen.getByText(/Build 4a9c12f/)).toBeInTheDocument();
    expect(screen.getByText('EN-DE')).toBeInTheDocument();
  });

  it('requests translation key for the privacy notice', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => defaultValue);

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange({ detailsOpen: true });

    expect(mockT).toHaveBeenCalledWith(
      'footer:privacy.notice',
      expect.stringContaining('portfolio showcases'),
    );
  });
});
