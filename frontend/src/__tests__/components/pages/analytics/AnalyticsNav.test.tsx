/**
 * @file AnalyticsNav.test.tsx
 * @module __tests__/components/pages/analytics/components/AnalyticsNav
 * @description
 * Enterprise tests for AnalyticsNav:
 * - Renders the full tab set
 * - Marks the active tab based on the `section` prop
 * - Navigates to the expected route when a tab is clicked
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { tEn } from '../../../test/i18nEn';

// B2 (CM-APP24): provide a react-i18next mock so useTranslation resolves without an
// i18n instance in this suite, silencing the NO_I18NEXT_INSTANCE warning. The stub
// mirrors react-i18next's no-instance fallback exactly — it returns an explicit string
// fallback / options.defaultValue when supplied, otherwise the key — so rendered text
// (and therefore every assertion) is unchanged.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
    i18n: { language: 'en' },
  }),
}));

// -----------------------------------------------------------------------------
// Router mock: isolate navigation side-effects while keeping the component renderable.
// -----------------------------------------------------------------------------

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const AnalyticsNav = (await import('@/pages/analytics/components/AnalyticsNav')).default;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

type Section = 'overview' | 'movements' | 'pricing' | 'inventory' | 'finance' | 'employees';

function setup(section: Section = 'overview', showEmployees = false) {
  return render(
    <MemoryRouter>
      <AnalyticsNav section={section} showEmployees={showEmployees} />
    </MemoryRouter>,
  );
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('AnalyticsNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all public tabs and hides the gated employees tab by default', () => {
    setup();

    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /movements/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /pricing/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /inventory/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /finance/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /employees/i })).not.toBeInTheDocument();
  });

  it('shows the employees tab only when showEmployees is set', () => {
    setup('overview', true);

    expect(screen.getByRole('tab', { name: /employees/i })).toBeInTheDocument();
  });

  it('navigates to the movements route when the movements tab is clicked', async () => {
    const user = userEvent.setup();

    setup();

    await user.click(screen.getByRole('tab', { name: /movements/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/analytics/movements');
  });

  it('marks the active tab based on the current section', () => {
    setup('inventory');

    expect(screen.getByRole('tab', { name: /inventory/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /overview/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('navigates to the correct route when a tab is clicked', async () => {
    const user = userEvent.setup();

    setup('overview');

    await user.click(screen.getByRole('tab', { name: /pricing/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/analytics/pricing');

    await user.click(screen.getByRole('tab', { name: /finance/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/analytics/finance');
  });

  it('navigates back to overview when overview tab is clicked from another section', async () => {
    const user = userEvent.setup();

    setup('pricing');

    await user.click(screen.getByRole('tab', { name: /overview/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/analytics/overview');
  });
});
