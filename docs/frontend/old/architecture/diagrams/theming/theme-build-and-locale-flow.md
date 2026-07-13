<a id="top"></a>

[⬅️ Back to Diagrams Index](../index.md)

- [Back to Architecture Index](../../index.md)
- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)
- [Back to Theme & Styling](../../theming/index.md)

# Theme build & locale flow

The MUI theme is built via a factory function and should match the chosen UI language.

```mermaid
graph TD
  Lang[i18n language\n(de/en)] --> Base[Base locale\n(de/en)]
  Base --> Theme[buildTheme(locale, mode)]
  Theme --> Packs[Merge locale packs\nMaterial + DataGrid]
  Theme --> Tokens[Tokens\npalette/typography/spacing]
  Theme --> Overrides[Defaults + overrides\ncompact density]
  Theme --> Provider[ThemeProvider]
  Provider --> UI[All UI components]
```

---

[Back to top](#top)
