[⬅️ Back to Frontend Architecture Index](../index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Theme & Styling

## 1️⃣ Section Purpose

This section documents how the UI look-and-feel is defined and enforced:

- the MUI theme factory (`frontend/src/theme/index.ts`)
- global CSS that sits beside MUI (`frontend/src/styles/global.css`)
- density defaults and component overrides for consistent “enterprise UI”

## 2️⃣ Scope & Boundaries

Included:
- Theme tokens (palette, typography, spacing, radius)
- MUI locale packs (Material + X Data Grid) and how locale is chosen
- Component defaults (dense/compact) and style overrides
- Global CSS helpers (scrollbars, print, `.visually-hidden`)

Excluded:
- Translation loading and language selection (see [i18n](../i18n/index.md))
- Domain-specific UI behavior (see [Domains](../domains/index.md))

## 3️⃣ High-Level Diagram

```mermaid
graph TD
  I18N[i18n language] --> Locale[Theme locale
(en/de)]
  Locale --> Theme[buildTheme(locale, mode)]
  Theme --> Provider[MUI ThemeProvider]
  Provider --> UI[Components]
  UI --> CSS[global.css + CssBaseline]
```

## 4️⃣ Section Map (Links to nested docs)

## Contents

- [Theme factory & MUI locales](./theme-factory-and-locales.md) - `buildTheme()`, locale bundles (Material + DataGrid), responsive typography
- [Component defaults & density](./component-defaults-and-density.md) - global `size='small'`, DataGrid `density='compact'`, chrome overrides
- [Global styles & CSS baseline](./global-styles-and-css-baseline.md) - `global.css`, scrollbars, accessibility helper, print styles

## Related ADRs

- [ADR-0007: i18n strategy and language/region settings integration](../adr/adr-0007-i18n-strategy-and-language-region-settings.md)
- [ADR-0001: Frontend folder structure strategy](../adr/adr-0001-frontend-folder-structure-strategy.md)

---

[⬅️ Back to Frontend Architecture Index](../index.md)
