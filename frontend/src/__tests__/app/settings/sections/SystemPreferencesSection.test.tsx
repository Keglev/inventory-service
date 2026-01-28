/**
 * @file SystemPreferencesSection.test.tsx
 * @module __tests__/app/settings/sections/SystemPreferencesSection
 * @description
 * Tests for SystemPreferencesSection.
 *
 * Scope:
 * - Renders system information values when provided
 * - Shows a loading indicator while data is being fetched
 * - Handles null systemInfo gracefully (empty/fallback state)
 * - Reacts to prop updates (systemInfo and isLoading)
 *
 * Out of scope:
 * - Fetching system info (network/query logic)
 * - Environment configuration / build pipeline logic
 * - Persistence of settings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SystemPreferencesSection from '../../../../app/settings/sections/SystemPreferencesSection';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Deterministic translation behavior for tests.
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe('SystemPreferencesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const systemInfo = {
    database: 'Oracle',
    environment: 'production',
    version: '1.0.0',
    status: 'healthy',
    buildDate: '2025-12-22',
  };

  function renderSection(params?: {
    info?: typeof systemInfo | null;
    isLoading?: boolean;
  }) {
    const info = params && 'info' in params ? params.info ?? null : systemInfo;
    const isLoading = params?.isLoading ?? false;

    return render(<SystemPreferencesSection systemInfo={info} isLoading={isLoading} />);
  }

  it('renders system information values when systemInfo is provided', () => {
    // UI contract: the section exposes environment metadata to the user.
    renderSection({ info: systemInfo, isLoading: false });

    expect(screen.getByText(/oracle/i)).toBeInTheDocument();
    expect(screen.getByText(/production/i)).toBeInTheDocument();
    expect(screen.getByText(/1\.0\.0/i)).toBeInTheDocument();

    // Build date may be displayed as raw value or within a labeled row.
    expect(screen.getByText(/2025-12-22/i)).toBeInTheDocument();
  });

  it('shows a loading spinner when isLoading is true', () => {
    // UX contract: while system info is loading, we show an explicit progress indicator.
    const { container } = renderSection({ info: null, isLoading: true });

    expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
  });

  it('does not show a spinner when isLoading is false', () => {
    const { container } = renderSection({ info: systemInfo, isLoading: false });

    expect(container.querySelector('.MuiCircularProgress-root')).not.toBeInTheDocument();
  });

  it('renders a safe fallback when systemInfo is null', () => {
    // Resilience contract: component must not crash without system info.
    renderSection({ info: null, isLoading: false });

    const fallback = screen.getByText(/system information unavailable/i);
    expect(fallback).toBeInTheDocument();
  });

  it('updates when systemInfo prop changes', () => {
    // Controlled rendering contract: UI reflects updated props.
    const { rerender } = renderSection({ info: systemInfo, isLoading: false });

    expect(screen.getByText(/oracle/i)).toBeInTheDocument();

    const updated = { ...systemInfo, database: 'PostgreSQL', environment: 'development' };

    rerender(<SystemPreferencesSection systemInfo={updated} isLoading={false} />);

    expect(screen.getByText(/postgresql/i)).toBeInTheDocument();
    expect(screen.getByText(/development/i)).toBeInTheDocument();
  });

  it('toggles loading state from true to false', () => {
    // Regression guard: spinner disappears and content appears when loading completes.
    const { container, rerender } = renderSection({ info: null, isLoading: true });

    expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();

    rerender(<SystemPreferencesSection systemInfo={systemInfo} isLoading={false} />);

    expect(container.querySelector('.MuiCircularProgress-root')).not.toBeInTheDocument();
    expect(screen.getByText(/oracle/i)).toBeInTheDocument();
  });
});
