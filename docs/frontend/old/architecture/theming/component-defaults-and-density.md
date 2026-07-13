<a id="top"></a>

[⬅️ Back to Theme & Styling Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Component defaults & density

A key goal of the theme is a consistent **compact enterprise density** without each screen re-specifying props.

## Global defaultProps (compact baseline)

The theme sets many components to `size='small'` by default (examples):

- `MuiButton`
- `MuiTextField`, `MuiFormControl`, `MuiSelect`, `MuiAutocomplete`
- `MuiTable`
- `MuiListItem`, `MuiListItemButton` (dense)

This keeps forms and navigation visually consistent across domains.

## DataGrid defaults

The X Data Grid is configured globally via theme default props:

- `density: 'compact'`

This matches the overall “dense UI” baseline.

## App chrome overrides

The theme also applies light polish via `styleOverrides` (examples):

- `MuiAppBar` shadow
- `MuiDrawer` border
- `MuiCard` / `MuiPaper` radius and shadow

Rule of thumb:
- prefer theme overrides for global consistency
- use `sx` for one-off layout only

---

```mermaid
graph TD
  Theme[buildTheme()] --> Defaults[defaultProps]
  Theme --> Overrides[styleOverrides]
  Defaults --> Screens[All screens]
  Overrides --> Screens
```

---

[Back to top](#top)
