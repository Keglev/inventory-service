/**
 * @file ImpressumPage.test.tsx
 * @module tests/components/pages/legal/ImpressumPage
 * @what_is_under_test ImpressumPage (incl. shared LegalPageLayout back behavior)
 * @responsibility
 * Guarantees the localized Impressum structure (title, provider, sections)
 * and the back button's direct-entry fallback to the landing page.
 * @out_of_scope
 * Translation content itself; routing registration (AppRouter suite).
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
});
