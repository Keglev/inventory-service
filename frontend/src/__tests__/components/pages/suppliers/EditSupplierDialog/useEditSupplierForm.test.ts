/**
 * @file useEditSupplierForm.test.ts
 *
 * @what_is_under_test useEditSupplierForm hook
 * @responsibility Orchestrate supplier search, selection, confirmation, and submission behaviour
 * @out_of_scope UI rendering, toast integration (validated in component test)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { SupplierRow } from '../../../../../api/suppliers/types';
import type { EditSupplierForm } from '../../../../../api/suppliers';
import type { UseEditSupplierFormReturn } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierForm';

const useAuthMock = vi.fn();
const useSupplierSearchMock = vi.fn();
const useEditSupplierFormStateMock = vi.fn();
const useEditSupplierConfirmationMock = vi.fn();
const updateSupplierMock = vi.fn();
const mapSupplierErrorMock = vi.fn((msg?: string | null, t?: TFunction) => {
  void t;
  return `mapped:${msg ?? 'unknown'}`;
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

vi.mock('../../../../../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/useSupplierSearch', () => ({
  useSupplierSearch: () => useSupplierSearchMock(),
}));

vi.mock('../../../../../pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierFormState', () => ({
  useEditSupplierFormState: () => useEditSupplierFormStateMock(),
}));

vi.mock('../../../../../pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierConfirmation', () => ({
  useEditSupplierConfirmation: () => useEditSupplierConfirmationMock(),
}));

vi.mock('../../../../../pages/suppliers/dialogs/EditSupplierDialog/mapSupplierErrors', () => ({
  mapSupplierError: (errorMsg: string | null | undefined, t: TFunction) =>
    mapSupplierErrorMock(errorMsg, t),
}));

vi.mock('../../../../../api/suppliers', () => ({
  updateSupplier: (...args: unknown[]) => updateSupplierMock(...args),
}));

import { useEditSupplierForm } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierForm';

const supplier: SupplierRow = {
  id: 'supplier-1',
  name: 'Acme Corp',
  contactName: 'Old Contact',
  phone: '555-9000',
  email: 'old@acme.com',
  createdBy: 'owner@example.com',
  createdAt: '2023-01-01',
};

const pendingChanges: EditSupplierForm = {
  supplierId: supplier.id,
  contactName: 'New Contact',
  phone: '555-9100',
  email: 'new@acme.com',
};

const createSearchState = () => ({
  searchQuery: '',
  setSearchQuery: vi.fn(),
  searchResults: [],
  searchLoading: false,
  handleSearchQueryChange: vi.fn(),
  resetSearch: vi.fn(),
});

const createFormState = () => ({
  register: vi.fn(),
  control: {} as UseEditSupplierFormReturn['control'],
  formState: { errors: {}, isSubmitting: false } as UseEditSupplierFormReturn['formState'],
  handleSubmit: vi.fn(),
  setValue: vi.fn(),
  reset: vi.fn(),
  populateWithSupplier: vi.fn(),
});

const createConfirmationState = () => {
  const state = {
    showConfirmation: false,
    setShowConfirmation: vi.fn(),
    pendingChanges: null as EditSupplierForm | null,
    setPendingChanges: vi.fn((changes: EditSupplierForm | null) => {
      state.pendingChanges = changes;
    }),
    reset: vi.fn(),
  };

  return state;
};

let confirmationState: ReturnType<typeof createConfirmationState>;

beforeEach(() => {
  useSupplierSearchMock.mockReset();
  useEditSupplierFormStateMock.mockReset();
  useEditSupplierConfirmationMock.mockReset();
  useAuthMock.mockReturnValue({ user: { email: 'admin@example.com' } });
  useSupplierSearchMock.mockReturnValue(createSearchState());
  useEditSupplierFormStateMock.mockReturnValue(createFormState());
  confirmationState = createConfirmationState();
  useEditSupplierConfirmationMock.mockReturnValue(confirmationState);
  updateSupplierMock.mockReset();
  mapSupplierErrorMock.mockClear();
});

describe('useEditSupplierForm', () => {
  it('selects supplier, populates form, and clears search', () => {
    const onUpdated = vi.fn();
    const { result } = renderHook(() => useEditSupplierForm(onUpdated));
    const searchState = useSupplierSearchMock.mock.results[0].value as ReturnType<typeof createSearchState>;
    const formState = useEditSupplierFormStateMock.mock.results[0].value as ReturnType<typeof createFormState>;

    act(() => {
      result.current.onSelectSupplierAndLoadForm(supplier);
    });

    expect(result.current.selectedSupplier).toEqual(supplier);
    expect(formState.populateWithSupplier).toHaveBeenCalledWith(supplier);
    expect(searchState.resetSearch).toHaveBeenCalled();
    expect(result.current.formError).toBe('');
  });

  it('does not submit when prerequisites are missing', async () => {
    const { result } = renderHook(() => useEditSupplierForm(vi.fn()));

    await act(async () => {
      await result.current.handleConfirmChanges();
    });

    expect(updateSupplierMock).not.toHaveBeenCalled();
  });

  it('submits updates and calls onUpdated on success', async () => {
    const onUpdated = vi.fn();
    const { result } = renderHook(() => useEditSupplierForm(onUpdated));
    const formState = useEditSupplierFormStateMock.mock.results[0].value as ReturnType<typeof createFormState>;

    act(() => {
      result.current.onSelectSupplierAndLoadForm(supplier);
    });
    confirmationState.pendingChanges = pendingChanges;
    formState.handleSubmit.mockImplementation((cb: (values: EditSupplierForm) => void) => async () => {
      cb(pendingChanges);
    });
    updateSupplierMock.mockResolvedValue({ success: true });

    await act(async () => {
      await result.current.handleConfirmChanges();
    });

    expect(updateSupplierMock).toHaveBeenCalledWith(supplier.id, {
      name: supplier.name,
      createdBy: 'admin@example.com',
      contactName: pendingChanges.contactName,
      phone: pendingChanges.phone,
      email: pendingChanges.email,
    });
    expect(onUpdated).toHaveBeenCalledTimes(1);
    expect(mapSupplierErrorMock).not.toHaveBeenCalled();
  });

  it('maps API error when update fails', async () => {
    const { result } = renderHook(() => useEditSupplierForm(vi.fn()));
    const formState = useEditSupplierFormStateMock.mock.results[0].value as ReturnType<typeof createFormState>;
    const searchState = useSupplierSearchMock.mock.results[0].value as ReturnType<typeof createSearchState>;

    act(() => {
      result.current.onSelectSupplierAndLoadForm(supplier);
    });
    confirmationState.pendingChanges = pendingChanges;
    formState.handleSubmit.mockImplementation((cb: (values: EditSupplierForm) => void) => async () => {
      cb(pendingChanges);
    });
    mapSupplierErrorMock.mockReturnValueOnce('Duplicate email error');
    updateSupplierMock.mockResolvedValue({ success: false, error: 'duplicate' });

    const resetCallsBefore = searchState.resetSearch.mock.calls.length;

    await act(async () => {
      await result.current.handleConfirmChanges();
    });

    expect(mapSupplierErrorMock).toHaveBeenCalledWith('duplicate', expect.any(Function));
    expect(result.current.formError).toBe('Duplicate email error');
    expect(confirmationState.setShowConfirmation).toHaveBeenCalledWith(false);
    expect(searchState.resetSearch).toHaveBeenCalledTimes(resetCallsBefore);
  });

  it('handles thrown errors during update', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useEditSupplierForm(vi.fn()));
    const formState = useEditSupplierFormStateMock.mock.results[0].value as ReturnType<typeof createFormState>;

    act(() => {
      result.current.onSelectSupplierAndLoadForm(supplier);
    });
    confirmationState.pendingChanges = pendingChanges;
    formState.handleSubmit.mockImplementation((cb: (values: EditSupplierForm) => void) => async () => {
      cb(pendingChanges);
    });
    mapSupplierErrorMock.mockReturnValueOnce('Network failure');
    updateSupplierMock.mockRejectedValue(new Error('network down'));

    await act(async () => {
      await result.current.handleConfirmChanges();
    });

    expect(mapSupplierErrorMock).toHaveBeenCalledWith('network down', expect.any(Function));
    expect(result.current.formError).toBe('Network failure');
    expect(confirmationState.setShowConfirmation).toHaveBeenCalledWith(false);
    consoleSpy.mockRestore();
  });

  it('resets search, confirmation, and form state when resetForm is called', () => {
    const { result } = renderHook(() => useEditSupplierForm(vi.fn()));
    const searchState = useSupplierSearchMock.mock.results[0].value as ReturnType<typeof createSearchState>;
    const formState = useEditSupplierFormStateMock.mock.results[0].value as ReturnType<typeof createFormState>;

    act(() => {
      result.current.onSelectSupplierAndLoadForm(supplier);
      result.current.setFormError('Bad things happened');
    });
    expect(result.current.formError).toBe('Bad things happened');

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.selectedSupplier).toBeNull();
    expect(result.current.formError).toBe('');
    expect(searchState.resetSearch).toHaveBeenCalled();
    expect(confirmationState.reset).toHaveBeenCalled();
    expect(formState.reset).toHaveBeenCalled();
  });
});

