/**
 * @file NotificationsSettingsSection.test.tsx
 * @module __tests__/app/settings/sections/NotificationsSettingsSection
 * @description
 * Tests for NotificationsSettingsSection.
 *
 * Scope:
 * - Verifies the placeholder section renders (feature stub for future work)
 * - Ensures user-visible placeholder text is present
 *
 * Out of scope:
 * - Notification preference controls and persistence
 * - Notification delivery / runtime behavior
 * - Detailed styling (MUI classnames) beyond basic rendering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotificationsSettingsSection from '../../../../app/settings/sections/NotificationsSettingsSection';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Deterministic translations for stable assertions.
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe('NotificationsSettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderSection() {
    return render(<NotificationsSettingsSection />);
  }

  it('renders without crashing', () => {
    // Baseline contract for placeholder sections: safe to mount in settings dialog.
    renderSection();

    // We expect at least one visible text node (heading or message).
    expect(screen.queryByRole('heading') ?? screen.queryByText(/notification/i)).toBeTruthy();
  });

  it('displays user-facing placeholder content', () => {
    // UX contract: section communicates that notifications settings are not yet available.
    renderSection();

    // Match broad placeholder wording without coupling to exact copy.
    const placeholder =
      screen.queryByText(/coming|soon|placeholder|notification/i) ?? screen.queryByRole('heading');

    expect(placeholder).toBeInTheDocument();
  });
});
