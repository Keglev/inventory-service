/**
 * @file usePriceChangeForm.test.types.ts
 * @description Minimal typed shapes for mocked inventory hook returns.
 *
 * We deliberately model only the properties used by usePriceChangeForm.
 * This avoids `any` while keeping tests decoupled from React Query internals.
 */

export type UseSuppliersQueryResult = {
  isLoading: boolean;
  data: unknown[];
};

export type UseItemSearchQueryResult = {
  isLoading: boolean;
  data: unknown[];
};

export type UseItemDetailsQueryResult = {
  isLoading: boolean;
  data: unknown | null;
};
