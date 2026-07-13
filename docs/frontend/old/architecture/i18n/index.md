[⬅️ Back to Frontend Architecture Index](../index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Internationalization (i18n)

## 1️⃣ Section Purpose

This section documents how Smart Supply Pro handles **internationalization** using **i18next + react-i18next**.

Goals:
- German-first initial experience (with English fully supported)
- predictable namespace structure (`/locales/{{lng}}/{{ns}}.json`)
- compile-time safety for translation keys via `resources.d.ts`

## 2️⃣ Scope & Boundaries

Included:
- i18next initialization (`frontend/src/i18n/index.ts`)
- language detection + persistence (`localStorage` key `i18nextLng`)
- namespace layout and JSON file structure under `frontend/public/locales/*`
- TypeScript typing of namespaces/keys (`frontend/src/i18n/resources.d.ts`)
- help-content integration (help topics map to `help:*` keys)

Excluded:
- MUI theming and locale packs (see [Theming](../theming/index.md))
- Domain page behavior (see [Domains](../domains/index.md))

## 3️⃣ High-Level Diagram

```mermaid
graph LR
  App[React App] --> T[useTranslation('<ns>')]
  T --> I18N[i18next instance]
  I18N --> Detect[Language detector]
  Detect --> LS[localStorage: i18nextLng]
  I18N --> Backend[i18next-http-backend]
  Backend --> JSON[public/locales/{lng}/{ns}.json]
```

## 4️⃣ Section Map (Links to nested docs)

## Contents

- [Initialization & language selection](./initialization-and-language-selection.md) - German-first defaults, detection order, persistence, and namespace loading
- [Namespaces & JSON resources](./namespaces-and-json-resources.md) - How namespaces map to `public/locales/*` and how to add new keys
- [Type safety with `resources.d.ts`](./type-safety-with-resources-d-ts.md) - Compile-time validation for `useTranslation()` namespaces and `t('...')` keys
- [Usage patterns & help content](./usage-patterns-and-help-content.md) - Recommended `t()` usage, cross-namespace calls, and the Help topics registry

## Related ADRs

- [ADR-0007: i18n strategy and language/region settings integration](../adr/adr-0007-i18n-strategy-and-language-region-settings.md)
- [ADR-0001: Frontend folder structure strategy](../adr/adr-0001-frontend-folder-structure-strategy.md)

---

[⬅️ Back to Frontend Architecture Index](../index.md)
