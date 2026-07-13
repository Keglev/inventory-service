<a id="top"></a>

[⬅️ Back to Diagrams Index](../index.md)

- [Back to Architecture Index](../../index.md)
- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Frontend module map

A map of the major frontend modules and the intended dependency direction.

```mermaid
graph TD
  Pages[src/pages/*\nDomain pages] --> UI[src/components/*\nShared UI]
  Pages --> Features[src/features/*\nCross-cutting UI features]
  Pages --> API[src/api/*\nDomain fetchers + hooks]
  Pages --> Hooks[src/hooks/*\nReusable hooks]

  Features --> Ctx[src/context/*\nProviders + contexts]
  Features --> Hooks
  Features --> UI

  Ctx --> Utils[src/utils/*\nPure utilities]
  API --> Utils
  API --> Http[src/api/httpClient.ts\nAxios client]
  Http --> Backend[Backend API]

  I18n[src/i18n/*] --> Public[public/locales/*\nJSON resources]
  Theme[src/theme/*] --> UI
  Styles[src/styles/*\nGlobal CSS] --> UI
```

Rules of thumb:
- Pages should consume stable hooks/components, not Axios details.
- Cross-cutting features (help/health) use contexts + hooks and stay reusable.

---

[Back to top](#top)
