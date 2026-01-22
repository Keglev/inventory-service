/**
 * @file HealthStatusDisplay.test.tsx
 * @module __tests__/app/footer
 *
 * @description
 * Unit tests for <HealthStatusDisplay /> — renders backend + database health indicators.
 *
 * Test strategy:
 * - Verify static labels ("Backend", "Database").
 * - Verify state rendering for online/offline backend and database.
 * - Verify response time rendering behavior (shown only when meaningful).
 * - Verify i18n integration (translation keys are requested).
 *
 * Notes:
 * - `react-i18next` is mocked to keep tests deterministic and independent of catalogs.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HealthStatusDisplay from '../../../app/footer/HealthStatusDisplay';

// -----------------------------------------------------------------------------
// i18n mock
// -----------------------------------------------------------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type Health = {
  status: 'online' | 'offline';
  responseTime: number;
  database: 'online' | 'offline';
};

describe('HealthStatusDisplay', () => {
  const baseHealth: Health = {
    status: 'online',
    responseTime: 125,
    database: 'online',
  };

  /**
   * Creates a health object for a specific scenario.
   * Keeps tests concise while making scenario differences explicit.
   */
  const makeHealth = (overrides?: Partial<Health>): Health => ({
    ...baseHealth,
    ...(overrides ?? {}),
  });

  /**
   * Arrange helper: renders the component with a scenario-specific health payload.
   */
  const arrange = (overrides?: Partial<Health>) =>
    render(<HealthStatusDisplay health={makeHealth(overrides)} />);

  beforeEach(() => {
    vi.clearAllMocks();

    // Deterministic translation stub: return defaultValue.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering: labels
  // ---------------------------------------------------------------------------
  it('renders backend label', () => {
    // Ensures the UI communicates what the first status refers to.
    arrange();
    expect(screen.getByText('Backend')).toBeInTheDocument();
  });

  it('renders database label', () => {
    // Ensures the UI communicates what the second status refers to.
    arrange();
    expect(screen.getByText('Database')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Backend status
  // ---------------------------------------------------------------------------
  it('renders backend online status', () => {
    arrange({ status: 'online' });
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders backend offline status', () => {
    arrange({ status: 'offline', responseTime: 0 });
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Response time
  // ---------------------------------------------------------------------------
  it('renders response time when online and non-zero', () => {
    arrange({ status: 'online', responseTime: 125 });
    expect(screen.getByText('125ms')).toBeInTheDocument();
  });

  it('does not render response time when zero', () => {
    // Avoids showing misleading performance info when the backend is offline/unreachable.
    arrange({ status: 'offline', responseTime: 0 });
    expect(screen.queryByText(/ms/)).not.toBeInTheDocument();
  });

  it('renders different response times on re-render', () => {
    // Regression guard: ensures the component updates when health changes.
    const { rerender } = render(
      <HealthStatusDisplay health={makeHealth({ responseTime: 50 })} />,
    );
    expect(screen.getByText('50ms')).toBeInTheDocument();

    rerender(<HealthStatusDisplay health={makeHealth({ responseTime: 250 })} />);
    expect(screen.getByText('250ms')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Database status (Oracle ADB label + online/offline)
  // ---------------------------------------------------------------------------
  it('renders database online indicator', () => {
    // In your UI this appears as the "Oracle ADB" label when database is reachable.
    arrange({ database: 'online' });
    expect(screen.getByText('Oracle ADB')).toBeInTheDocument();
  });

  it('renders database offline indicator', () => {
    arrange({ database: 'offline' });

    // There can be multiple "Offline" labels (backend + database), so use getAllByText.
    const offline = screen.getAllByText('Offline');
    expect(offline.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // i18n wiring
  // ---------------------------------------------------------------------------
  it('requests translations for labels', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => defaultValue);
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange();

    expect(mockT).toHaveBeenCalledWith('footer:health.backend', 'Backend');
    expect(mockT).toHaveBeenCalledWith('footer:health.database', 'Database');
  });
});
