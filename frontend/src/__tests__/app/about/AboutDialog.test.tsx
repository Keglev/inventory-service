/**
 * @file AboutDialog.test.tsx
 * @module __tests__/app/about/AboutDialog
 * @testing Vitest + React Testing Library; useHealthCheck and appMeta mocked
 * @description
 * Contract of the About dialog (FW5 fork 3):
 * - Shows version, the first 10 characters of the build id (full id in the title),
 *   environment, backend status and the database product from the shared health query.
 * - Offline backend and an unknown database product are stated, not guessed.
 * - Renders nothing while closed; the close button calls onClose.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tEn } from '@/__tests__/test/i18nEn';
import AboutDialog from '@/app/about/AboutDialog';

const mockUseHealthCheck = vi.hoisted(() => vi.fn());

vi.mock('@/features/health/hooks/useHealthCheck', () => ({
  useHealthCheck: () => mockUseHealthCheck(),
}));
vi.mock('@/config/appMeta', () => ({
  APP_VERSION: '1.2.0',
  BUILD_ID: '31833c2f6d51eb2aebbfef1e3e212632bf6fd6b6',
  APP_ENVIRONMENT: 'Production (Koyeb)',
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => tEn(key, options) }),
}));

const health = (status: 'online' | 'offline', databaseProduct: string | null) => ({
  health: { status, database: status, databaseProduct, responseTime: 120, timestamp: 1 },
  loading: false,
  refetch: vi.fn(),
});

describe('AboutDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseHealthCheck.mockReturnValue(health('online', 'Oracle'));
  });

  it('renders nothing while closed', () => {
    render(<AboutDialog open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows version, short build, environment, backend status and database', () => {
    render(<AboutDialog open onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'About Smart Supply Pro' });

    expect(dialog).toHaveTextContent('Version1.2.0');
    expect(screen.getByText('31833c2f6d')).toHaveAttribute('title', '31833c2f6d51eb2aebbfef1e3e212632bf6fd6b6');
    expect(dialog).toHaveTextContent('EnvironmentProduction (Koyeb)');
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(dialog).toHaveTextContent('DatabaseOracle');
  });

  it('states an offline backend and an unknown database product', () => {
    mockUseHealthCheck.mockReturnValue(health('offline', null));
    render(<AboutDialog open onClose={vi.fn()} />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveTextContent('DatabaseUnknown');
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AboutDialog open onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
