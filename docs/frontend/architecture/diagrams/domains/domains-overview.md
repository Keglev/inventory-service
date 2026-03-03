<a id="top"></a>

[⬅️ Back to Diagrams Index](../index.md)

- [Back to Architecture Index](../../index.md)
- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)
- [Back to Domains](../../domains/index.md)

# Domains overview (page orchestration)

This diagram shows the recurring domain “page orchestrator” shape used throughout the app.

```mermaid
graph LR
  Page[Domain Page\n"Board" / Orchestrator] --> State[State hook\n(filters, ui state)]
  Page --> Handlers[Handler hooks\n(onSearch, onOpenDialog...)]
  Page --> Queries[Data hooks\n(React Query)]
  Page --> UI[Presentational components\n(tables, charts, cards)]
  Page --> Dialogs[Dialog containers\n(create/edit/delete)]

  Queries --> API[Domain API\n(fetchers/mutations)]
  API --> Http[httpClient]
  Http --> Backend[Backend API]

  State --> Queries
  Handlers --> State
  Handlers --> Dialogs
  Dialogs --> API
```

Why this matters:
- Keeps UI predictable: one place “owns” orchestration and wiring.
- Makes domain pages easy to test and refactor.

---

[Back to top](#top)
