/**
 * @file EngineeringCallout.test.tsx
 * @module __tests__/components/pages/home/sections/EngineeringCallout
 * @testing Vitest + Testing Library, mocked i18n resolving the English landing JSON.
 * @description Tests for the landing block that links out to the documentation site
 *   and the public source repository.
 *
 * Contract under test:
 * - Both calls to action are anchors, not buttons: they leave the application.
 * - Both open in a new tab and carry rel="noopener noreferrer".
 * - The hrefs point at the published docs site and the GitHub repository.
 *
 * Out of scope: the reachability of those external URLs (verified in docs CI).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import EngineeringCallout from '../../../../../pages/home/sections/EngineeringCallout';
import { tEn } from '../../../../test/i18nEn';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

describe('EngineeringCallout', () => {
  it('links to the architecture documentation in a new tab', () => {
    render(<EngineeringCallout />);

    const docs = screen.getByRole('link', { name: /read the architecture docs/i });
    expect(docs).toHaveAttribute('href', 'https://keglev.github.io/inventory-service/');
    expect(docs).toHaveAttribute('target', '_blank');
    expect(docs).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('links to the public source repository in a new tab', () => {
    render(<EngineeringCallout />);

    const repo = screen.getByRole('link', { name: /view the source on github/i });
    expect(repo).toHaveAttribute('href', 'https://github.com/Keglev/inventory-service');
    expect(repo).toHaveAttribute('target', '_blank');
    expect(repo).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
