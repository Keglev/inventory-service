<a id="top"></a>

[⬅️ Back to Diagrams Index](../index.md)

- [Back to Architecture Index](../../index.md)
- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)
- [Back to State](../../state/index.md)

# Provider composition (conceptual)

Provider placement determines which parts of the app can access global state and cross-cutting UX services.

```mermaid
graph TB
  Root[App Root] --> Auth[AuthProvider]
  Root --> Settings[SettingsProvider]
  Root --> Help[HelpProvider]

  Root --> Router[AppRouter]
  Router --> Shells[PublicShell / AppShell]
  Shells --> Toast[Toast provider\n(shell-scoped UX)]
  Shells --> Pages[Pages]
```

Notes:
- This is a conceptual diagram. Exact bootstrap wiring can evolve.
- Settings and i18n/theme behavior are related (language → formats/locale).

---

[Back to top](#top)
