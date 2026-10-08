/**
 * @file AppFooter.test.tsx
 * @module tests/app/footer/AppFooter
 * @description Contract tests for AppFooter.
 *
 * Contract under test:
 * - Guarantees the static compact footer bar renders its three sections
 *   (metadata, documentation links, health) with no expandable state.
 *
 * Out of scope:
 * - Sub-component internals (FooterMetaInfo, FooterLinks,
 *   HealthStatusDisplay have their own suites); health polling behavior
 *   (features/health).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppFooter from '@/app/footer/AppFooter';
import { tEn } from '@/__tests__/test/i18nEn';

// -----------------------------
// Mocks (hoisted so they are available to vi.mock factory)
// -----------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());
const mockUseFooterState = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

vi.mock('@/app/footer/useFooterState', () => ({
  useFooterState: mockUseFooterState,
}));

// ----------------------------
// Local types for the mocked hook return
// ----------------------------
type FooterHealth = {
  status: 'online' | 'offline';
  responseTime: number;
  database: 'online' | 'offline';
  databaseProduct: string | null;
};

type FooterConfig = {
  appVersion: string;
  buildId: string;
};

type FooterState = {
  health: FooterHealth;
  config: FooterConfig;
};

type FooterStateOverrides = {
  health?: Partial<FooterHealth>;
  config?: Partial<FooterConfig>;
};

describe('AppFooter', () => {
  const makeState = (overrides: FooterStateOverrides = {}): FooterState => {
    const base: FooterState = {
      health: { status: 'online', responseTime: 125, database: 'online', databaseProduct: 'Oracle' },
      config: {
        appVersion: '1.0.0',
        buildId: '4a9c12f',
      },
    };

    return {
      health: { ...base.health, ...(overrides.health ?? {}) },
      config: { ...base.config, ...(overrides.config ?? {}) },
    };
  };

  const arrange = (overrides?: FooterStateOverrides) => {
    mockUseFooterState.mockReturnValue(makeState(overrides));
    // FooterLinks renders internal react-router links and needs a router context.
    return render(
      <MemoryRouter>
        <AppFooter />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Deterministic translation stub: returns defaultValue.
    mockUseTranslation.mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
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

  it('renders the compact metadata string', () => {
    const { container } = arrange();
    const year = new Date().getFullYear();
    expect(container.textContent).toContain(`© ${year} Smart Supply Pro • v1.0.0 • Build 4a9c12f`);
  });

  it('renders the documentation link row', () => {
    arrange();
    expect(screen.getByRole('link', { name: 'Documentation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'API Reference' })).toBeInTheDocument();
  });

  it('renders the health status with the reported database product', () => {
    arrange();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('Oracle')).toBeInTheDocument();
  });

  // -----------------------------
  // Removed behavior
  // -----------------------------
  it('renders no expand/collapse control', () => {
    arrange();
    expect(screen.queryByLabelText('Footer details')).toBeNull();
  });

  it('renders no details-panel content', () => {
    arrange();
    expect(screen.queryByText(/portfolio showcases a fictional/)).toBeNull();
  });
});
