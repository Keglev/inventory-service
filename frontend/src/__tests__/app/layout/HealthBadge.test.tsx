/**
 * @file HealthBadge.test.tsx
 * @module __tests__/app/layout/header/HealthBadge
 * @description
 * Tests for the HealthBadge header component.
 *
 * Scope:
 * - Renders the correct health label based on backend + database status.
 * - Applies the expected MUI Chip color variant (success/warning/error).
 *
 * Out of scope:
 * - Health check polling/timers
 * - API implementation details
 * - Tooltip interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HealthBadge from '../../../app/layout/header/HealthBadge';

type BackendStatus = 'online' | 'offline';
type DbStatus = 'online' | 'offline';

type HealthHookReturn = {
  health: {
    status: BackendStatus;
    database: DbStatus;
    responseTime: number;
  };
};

/**
 * Hoisted mocks:
 * Keep hook + i18n deterministic and isolate state between tests.
 */
const mockUseTranslation = vi.hoisted(() => vi.fn());
const mockUseHealthCheck = vi.hoisted(() => vi.fn<[], HealthHookReturn>());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

vi.mock('../../../features/health', () => ({
  useHealthCheck: () => mockUseHealthCheck(),
}));

/** Helpers */
function renderWithHealth(backend: BackendStatus, db: DbStatus) {
  mockUseHealthCheck.mockReturnValue({
    health: {
      status: backend,
      database: db,
      responseTime: backend === 'online' ? 50 : 0,
    },
  });

  return render(<HealthBadge />);
}

function expectChipColor(container: HTMLElement, color: 'success' | 'warning' | 'error') {
  // Note: This assertion intentionally couples to MUI Chip class names.
  const colorClass = color.charAt(0).toUpperCase() + color.slice(1);
  const chip = container.querySelector(`.MuiChip-color${colorClass}`);
  expect(chip).toBeInTheDocument();
}

describe('HealthBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Return the provided default value to keep assertions independent of translation files.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
    });
  });

  describe('Status rendering (label + color)', () => {
    const cases: Array<{
      backend: BackendStatus;
      db: DbStatus;
      expectedLabel: 'System OK' | 'Degraded' | 'Offline';
      expectedColor: 'success' | 'warning' | 'error';
      note: string;
    }> = [
      {
        backend: 'online',
        db: 'online',
        expectedLabel: 'System OK',
        expectedColor: 'success',
        note: 'All dependencies reachable.',
      },
      {
        backend: 'online',
        db: 'offline',
        expectedLabel: 'Degraded',
        expectedColor: 'warning',
        note: 'Backend up, database connectivity impacted.',
      },
      {
        backend: 'offline',
        db: 'online',
        expectedLabel: 'Offline',
        expectedColor: 'error',
        note: 'Backend is authoritative; offline overrides DB status.',
      },
      {
        backend: 'offline',
        db: 'offline',
        expectedLabel: 'Offline',
        expectedColor: 'error',
        note: 'Total outage scenario.',
      },
    ];

    cases.forEach(({ backend, db, expectedLabel, expectedColor }) => {
      it(`renders "${expectedLabel}" (${expectedColor}) when backend=${backend} and db=${db}`, () => {
        // This table test covers the full state matrix for backend/database availability.
        // Note: ${note}
        const { container } = renderWithHealth(backend, db);

        expect(screen.getByText(expectedLabel)).toBeInTheDocument();
        expectChipColor(container, expectedColor);
      });
    });
  });

  describe('Offline precedence rule', () => {
    it('renders "Offline" even when the database reports online but backend is offline', () => {
      // Business rule: backend status determines overall availability (DB cannot be trusted if backend is down).
      renderWithHealth('offline', 'online');

      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });
});
