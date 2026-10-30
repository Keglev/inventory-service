/**
 * @file SupplierPickerField.test.tsx
 * @module __tests__/components/search/SupplierPickerField
 * @description Contract tests for the shared supplier picker (S2-9). Sibling:
 *   api/suppliers/matchSupplierOptions.test.ts (the matcher).
 *
 * Contract under test:
 * - The picker lists the matches, forwards a pick and a clear (null).
 * - A value set by the caller puts its name in the field; a reset to null empties it.
 * - The caller's placeholder replaces the type-to-search hint and keeps the label up.
 */

import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SupplierPickerField } from '@/components/search/SupplierPickerField';
import type { SupplierOption } from '@/api/analytics/types';
import { tEn } from '@/__tests__/test/i18nEn';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => tEn(key, options) }),
}));

const suppliers: SupplierOption[] = [
  { id: 's1', label: 'Nordbay Industriebedarf GmbH' },
  { id: 's2', label: 'Nordlicht Werkzeuge GmbH' },
  { id: 's3', label: 'Steelcraft Components Ltd.' },
];

function Harness({ initial = null, onSelect = vi.fn() }: { initial?: SupplierOption | null; onSelect?: (s: SupplierOption | null) => void }) {
  const [value, setValue] = React.useState<SupplierOption | null>(initial);
  return (
    <>
      <SupplierPickerField
        suppliers={suppliers}
        loading={false}
        value={value}
        onSelect={(s) => {
          setValue(s);
          onSelect(s);
        }}
        label="Supplier"
      />
      <button onClick={() => setValue(null)}>reset</button>
      <button onClick={() => setValue(suppliers[2])}>set steelcraft</button>
    </>
  );
}

describe('SupplierPickerField', () => {
  it('lists the matching suppliers and forwards the pick', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);

    await user.type(screen.getByLabelText('Supplier'), 'nord');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Nordbay Industriebedarf GmbH',
      'Nordlicht Werkzeuge GmbH',
    ]);
    await user.click(screen.getByRole('option', { name: 'Nordlicht Werkzeuge GmbH' }));

    expect(onSelect).toHaveBeenLastCalledWith(suppliers[1]);
    expect(screen.getByLabelText('Supplier')).toHaveValue('Nordlicht Werkzeuge GmbH');
  });

  it('forwards null when the field is cleared', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Harness initial={suppliers[0]} onSelect={onSelect} />);

    await user.clear(screen.getByLabelText('Supplier'));

    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it('follows a value the caller sets or resets', async () => {
    const user = userEvent.setup();
    render(<Harness initial={suppliers[0]} />);
    expect(screen.getByLabelText('Supplier')).toHaveValue('Nordbay Industriebedarf GmbH');

    await user.click(screen.getByRole('button', { name: 'set steelcraft' }));
    expect(screen.getByLabelText('Supplier')).toHaveValue('Steelcraft Components Ltd.');

    await user.click(screen.getByRole('button', { name: 'reset' }));
    expect(screen.getByLabelText('Supplier')).toHaveValue('');
  });

  it('shows the caller placeholder with the label up, else the type-to-search hint', () => {
    const { rerender } = render(
      <SupplierPickerField suppliers={suppliers} loading={false} value={null} onSelect={vi.fn()} label="Supplier" />,
    );
    expect(screen.getByLabelText('Supplier')).toHaveAttribute('placeholder', 'Enter supplier name (min 2 chars)...');

    rerender(
      <SupplierPickerField suppliers={suppliers} loading={false} value={null} onSelect={vi.fn()} label="Supplier" placeholder="All suppliers" />,
    );
    expect(screen.getByLabelText('Supplier')).toHaveAttribute('placeholder', 'All suppliers');
    expect(screen.getByText('Supplier', { selector: 'label' })).toHaveAttribute('data-shrink', 'true');
  });
});
