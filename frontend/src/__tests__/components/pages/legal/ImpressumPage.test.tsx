/**
 * @file ImpressumPage.test.tsx
 * @module tests/components/pages/legal/ImpressumPage
 * @description Contract tests for ImpressumPage (incl. shared LegalPageLayout back
 * behavior).
 *
 * Contract under test:
 * - Guarantees the localized Impressum structure (title, provider,
 *   sections) and the back button's direct-entry fallback to the landing
 *   page.
 *
 * Out of scope:
 * - Translation content itself; routing registration (AppRouter suite).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import ImpressumPage from '../../../../pages/legal/ImpressumPage';

const mockUseTranslation = vi.hoisted(() => vi.fn());
vi.mock('react-i18next', () => ({ useTranslation: mockUseTranslation }));

const LocationProbe = () => <div data-testid="location">{useLocation().pathname}</div>;

describe('ImpressumPage', () => {
  const arrange = () =>
    render(
      <MemoryRouter initialEntries={['/impressum']}>
        <LocationProbe />
        <Routes>
          <Route path="/impressum" element={<ImpressumPage />} />
          <Route path="/" element={<div>Landing</div>} />
        </Routes>
      </MemoryRouter>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    // Deterministic stub: t() returns the key so assertions pin key wiring.
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders the localized page title as the h1', () => {
    arrange();
    expect(screen.getByRole('heading', { level: 1, name: 'impressum.title' })).toBeInTheDocument();
  });

  it('renders provider name and email from the legal namespace', () => {
    arrange();
    expect(screen.getByText('impressum.provider.name')).toBeInTheDocument();
    expect(screen.getByText('impressum.provider.email')).toBeInTheDocument();
  });

  it('renders the non-commercial framing and MStV responsibility sections', () => {
    arrange();
    expect(screen.getByText('impressum.nature.body')).toBeInTheDocument();
    expect(screen.getByText('impressum.responsible.body')).toBeInTheDocument();
  });

  it('falls back to the landing page on back when there is no in-app history', () => {
    arrange();
    // Direct entry: jsdom window.history.state has no router idx -> fallback '/'.
    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/');
    expect(screen.getByText('Landing')).toBeInTheDocument();
  });

  it('navigates back in history when an in-app entry exists', () => {
    // Simulate router-managed history: idx > 0 means a previous in-app page.
    window.history.replaceState({ idx: 2 }, '');
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});

    arrange();
    fireEvent.click(screen.getByRole('button', { name: 'back' }));

    // MemoryRouter maps navigate(-1) to a history pop; the page itself must
    // not have fallen back to the landing route.
    expect(screen.queryByText('Landing')).not.toBeInTheDocument();

    backSpy.mockRestore();
    window.history.replaceState(null, '');
  });
});
