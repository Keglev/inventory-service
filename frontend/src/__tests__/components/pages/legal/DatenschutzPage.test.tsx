/**
 * @file DatenschutzPage.test.tsx
 * @module tests/components/pages/legal/DatenschutzPage
 * @what_is_under_test DatenschutzPage
 * @responsibility
 * Guarantees the localized privacy policy structure: title, intro, the nine
 * ordered GDPR sections, and the last-updated stamp.
 * @out_of_scope
 * Translation content itself; back-button behavior (ImpressumPage suite
 * covers the shared LegalPageLayout).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DatenschutzPage from '../../../../pages/legal/DatenschutzPage';

const mockUseTranslation = vi.hoisted(() => vi.fn());
vi.mock('react-i18next', () => ({ useTranslation: mockUseTranslation }));

describe('DatenschutzPage', () => {
  const arrange = () =>
    render(
      <MemoryRouter initialEntries={['/datenschutz']}>
        <DatenschutzPage />
      </MemoryRouter>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders the localized page title as the h1', () => {
    arrange();
    expect(screen.getByRole('heading', { level: 1, name: 'privacy.title' })).toBeInTheDocument();
  });

  it('renders the intro and the last-updated stamp', () => {
    arrange();
    expect(screen.getByText('privacy.intro')).toBeInTheDocument();
    expect(screen.getByText('privacy.updated')).toBeInTheDocument();
  });

  it('renders all nine privacy sections in order', () => {
    arrange();
    const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
    expect(sectionHeadings.map((h: HTMLElement) => h.textContent)).toEqual([
      'privacy.controller.title',
      'privacy.hosting.title',
      'privacy.oauth.title',
      'privacy.localStorage.title',
      'privacy.demoData.title',
      'privacy.transfer.title',
      'privacy.retention.title',
      'privacy.rights.title',
      'privacy.complaint.title',
    ]);
    expect(screen.getByText('privacy.hosting.body')).toBeInTheDocument();
  });
});
