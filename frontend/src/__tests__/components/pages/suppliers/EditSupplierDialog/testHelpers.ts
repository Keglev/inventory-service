import { vi } from 'vitest';
import type { EditSupplierForm } from '../../../../../api/suppliers';
import type { SupplierRow } from '../../../../../api/suppliers/types';
import type { UseEditSupplierFormReturn } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierForm';

/**
 * Small, local test helpers for the EditSupplierDialog test directory.
 *
 * Rationale:
 * - These tests deliberately mock orchestration boundaries (hooks / child components).
 * - Keeping mock builders centralized reduces repetition and keeps individual test files focused.
 */

export type EditSupplierDialogFormOverrides = Omit<Partial<UseEditSupplierFormReturn>, 'formState'> & {
  formState?: Pick<UseEditSupplierFormReturn['formState'], 'errors' | 'isSubmitting'>;
};

/**
 * Creates a fully-populated `UseEditSupplierFormReturn` mock.
 *
 * Tests can override only what they need while still satisfying the container's contract.
 */
export const createEditSupplierDialogForm = (
  overrides: EditSupplierDialogFormOverrides = {}
): UseEditSupplierFormReturn => {
  const formState = {
    errors: overrides.formState?.errors ?? {},
    isSubmitting: overrides.formState?.isSubmitting ?? false,
  } as UseEditSupplierFormReturn['formState'];

  const form: UseEditSupplierFormReturn = {
    searchQuery: '',
    searchResults: [],
    searchLoading: false,
    handleSearchQueryChange: vi.fn(async () => undefined),

    selectedSupplier: null,
    handleSelectSupplier: vi.fn(),

    register: vi.fn() as unknown as UseEditSupplierFormReturn['register'],
    control: {} as UseEditSupplierFormReturn['control'],
    handleSubmit: vi.fn(() => vi.fn()) as unknown as UseEditSupplierFormReturn['handleSubmit'],
    setValue: vi.fn() as unknown as UseEditSupplierFormReturn['setValue'],

    showConfirmation: false,
    setShowConfirmation: vi.fn(),
    pendingChanges: null,
    setPendingChanges: vi.fn(),

    formError: '',
    setFormError: vi.fn(),

    handleConfirmChanges: vi.fn(async () => undefined),
    resetForm: vi.fn(),
    onSelectSupplierAndLoadForm: vi.fn(),

    ...overrides,
    formState,
  };

  return form;
};

export const createSupplierSearchState = () => ({
  searchQuery: '',
  setSearchQuery: vi.fn(),
  searchResults: [] as SupplierRow[],
  searchLoading: false,
  handleSearchQueryChange: vi.fn(async () => undefined),
  resetSearch: vi.fn(),
});

export const createEditSupplierFormState = () => ({
  register: vi.fn(),
  control: {} as UseEditSupplierFormReturn['control'],
  formState: { errors: {}, isSubmitting: false } as UseEditSupplierFormReturn['formState'],
  handleSubmit: vi.fn(),
  setValue: vi.fn(),
  reset: vi.fn(),
  populateWithSupplier: vi.fn(),
});

export const createEditSupplierConfirmationState = () => ({
  showConfirmation: false,
  setShowConfirmation: vi.fn(),
  pendingChanges: null as EditSupplierForm | null,
  setPendingChanges: vi.fn(),
  reset: vi.fn(),
});

export type UseEditSupplierFormMockContainer = {
  useAuth: ReturnType<typeof vi.fn>;
  useSupplierSearch: ReturnType<typeof vi.fn>;
  useEditSupplierFormState: ReturnType<typeof vi.fn>;
  useEditSupplierConfirmation: ReturnType<typeof vi.fn>;
};

/**
 * Installs default dependency mocks for `useEditSupplierForm`.
 *
 * Returns the concrete state objects so tests can mutate them (e.g. set pendingChanges)
 * without relying on brittle `mock.results[0].value` casting.
 */
export const setupUseEditSupplierFormDeps = (
  mocks: UseEditSupplierFormMockContainer,
  overrides: { userEmail?: string } = {}
) => {
  const searchState = createSupplierSearchState();
  const formState = createEditSupplierFormState();
  const confirmationState = createEditSupplierConfirmationState();

  mocks.useAuth.mockReturnValue({ user: { email: overrides.userEmail ?? 'admin@example.com' } });
  mocks.useSupplierSearch.mockReturnValue(searchState);
  mocks.useEditSupplierFormState.mockReturnValue(formState);
  mocks.useEditSupplierConfirmation.mockReturnValue(confirmationState);

  return { searchState, formState, confirmationState };
};
