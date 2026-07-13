<a id="top"></a>

[⬅️ Back to Theme & Styling Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Theme factory & MUI locales

The theme factory lives in `frontend/src/theme/index.ts` and exposes a single entry point:

- `buildTheme(locale, mode)`

## Theme factory responsibilities

- Create a consistent token set for palette, typography, spacing, and shape
- Merge MUI locale bundles for:
  - Material Core (`@mui/material/locale`)
  - X Data Grid (`@mui/x-data-grid/locales`)
- Enable CSS variables output (`cssVariables: true`)
- Apply `responsiveFontSizes()` to scale typography on different viewports

## Supported locales

The theme layer currently supports:

- `de` and `en`

The code merges locale packs like:

- `de`: `coreDeDE` + `dataGridDeDE`
- `en`: `coreEnUS` + `dataGridEnUS`

## How locale should be chosen

- The app’s language comes from i18n (`i18n.language`).
- The theme locale should match the i18n language base (`de` / `en`).

This is important for:
- DataGrid built-in strings (pagination, toolbar)
- any Material locale-sensitive labels

---

```mermaid
graph LR
  I18N[i18n.language] --> Base[base locale
'en'|'de']
  Base --> Theme[buildTheme(base, mode)]
  Theme --> LocaleBundle[MUI locale bundles]
  Theme --> Tokens[palette/typography/spacing]
```

---

[Back to top](#top)
