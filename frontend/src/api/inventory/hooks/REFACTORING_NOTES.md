/**
 * REFACTORING SUMMARY: useInventoryData.ts Split
 * 
 * BEFORE:
 * - useInventoryData.ts (monolithic file with 3 hooks + 2 helpers, ~350 lines)
 * 
 * AFTER:
 * - Organized into 3 focused hook modules + 1 barrel export coordinator
 * 
 * FILE STRUCTURE:
 * ├── useSuppliersQuery.ts (~50 lines)
 * │   └── useSuppliersQuery() - Supplier list for dropdowns (5-min cache)
 * │
 * ├── useItemSearchQuery.ts (~90 lines)
 * │   ├── Hook for item type-ahead search
 * │   ├── Client-side supplier filtering (backend workaround)
 * │   └── 30-second cache
 * │
 * ├── useItemDetailsQuery.ts (~65 lines)
 * │   └── Fetch complete item data for forms/dialogs (30-sec cache)
 * │
 * └── useInventoryData.ts (barrel export, ~40 lines)
 *     └── Coordinator - unified export point for all hooks
 * 
 * ENTERPRISE BENEFITS:
 * ✓ Single Responsibility Principle - each hook module handles one concern
 * ✓ All files under 100 lines - maximizes maintainability and readability
 * ✓ Easier to test - isolated, focused test files per hook
 * ✓ Better code organization - logical grouping by feature
 * ✓ Improved maintainability - smaller, focused files
 * ✓ Complete TypeDoc documentation - full coverage maintained
 * ✓ Zero breaking changes - backward compatible barrel export
 * ✓ Better tree-shaking potential - unused hooks won't be bundled
 * ✓ Clear separation of concerns - supplier vs item vs details logic
 * 
 * EXISTING IMPORTS:
 * All existing imports from '@/api/inventory/hooks' continue to work
 * through the barrel export without any changes needed.
 * 
 * Examples (NO CHANGES REQUIRED):
 * import { useSuppliersQuery } from '@/api/inventory/hooks/useInventoryData';
 * import { useItemSearchQuery } from '@/api/inventory/hooks/useInventoryData';
 * import { useItemDetailsQuery } from '@/api/inventory/hooks/useInventoryData';
 * 
 * CACHING STRATEGY APPLIED:
 * - Suppliers: 5-minute cache (stable reference data)
 * - Item search: 30-second cache (quick user interaction)
 * - Item details: 30-second cache (user selection follow-up)
 * 
 * BACKEND LIMITATION WORKAROUND:
 * The /api/inventory search endpoint doesn't properly filter by supplierId,
 * so useItemSearchQuery applies client-side filtering to ensure supplier isolation.
 * This is transparently handled by the hook - no changes needed in consuming components.
 */
