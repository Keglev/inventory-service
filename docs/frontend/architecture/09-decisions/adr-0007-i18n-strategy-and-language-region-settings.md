# ADR-0007: i18n strategy and language/region settings integration

## Status
Accepted

## Date
2026-03-03

## Context
The product targets a German-speaking audience but must support English.
The app must:
- load translations by namespace
- persist user language choice
- keep user-facing formatting (date/number) aligned with language choices

Forces/constraints:
- **Consistency:** translations must be organized predictably by namespace.
- **Maintainability:** translation keys should be type-safe to prevent regressions.
- **UX:** first impression should be German-first without blocking user choice.

## Decision
We centralize i18n configuration and keep language/region controls in the settings UI:

- i18n init is centralized in:
  - `frontend/src/i18n/index.ts`
  - language detection order: localStorage → querystring → navigator
  - German-first default on first visit via `localStorage` key `i18nextLng`

- type safety is ensured via:
  - `frontend/src/i18n/resources.d.ts` (i18next module augmentation using JSON shapes)

- language/region settings are surfaced in the app menu:
  - `frontend/src/app/HamburgerMenu/LanguageRegionSettings/*`

- user preference sync is handled in settings context:
  - `frontend/src/context/settings/SettingsContext.tsx` (reacts to `i18n.language`)

## Alternatives Considered
1. **Static build-time translations only**
   - Pros:
     - No runtime network loading
   - Cons:
     - Less flexible; harder to add namespaces incrementally

2. **Untyped i18n keys** (string keys everywhere)
   - Pros:
     - Fast to start
   - Cons:
     - Refactors break silently
     - Harder to maintain large key sets

3. **Per-domain i18n configuration**
   - Pros:
     - Domain autonomy
   - Cons:
     - Inconsistent detection/persistence behavior

## Consequences
### Positive
- German-first default aligns with target audience.
- Users can override and persist language choice.
- Translation keys and namespaces are safer to refactor.
- Settings can keep formatting aligned with language.

### Negative / Tradeoffs
- Must keep JSON resources and `resources.d.ts` in sync.
- Requires discipline in namespace ownership (what belongs in `common` vs domain namespaces).

## Implementation Notes
- Where it is implemented (paths, key modules)
  - i18n boot: `frontend/src/i18n/index.ts`
  - typing: `frontend/src/i18n/resources.d.ts`
  - menu settings: `frontend/src/app/HamburgerMenu/LanguageRegionSettings/*`
  - settings provider: `frontend/src/context/settings/SettingsContext.tsx`

- Migration notes (if relevant)
  - When adding a namespace, update both `I18N_NAMESPACES` and `resources.d.ts`.

- Testing implications (what should be tested and where)
  - i18n initialization and typing expectations: `frontend/src/__tests__/unit/i18n/*`.

## References
- Architecture docs: [Internationalization (i18n)](../i18n/index.md), [Theme & Styling](../theming/index.md)
- Diagram: [i18n boot flow](../diagrams/i18n/i18n-boot-flow.md)
- Related ADRs: ADR-0006
