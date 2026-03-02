<a id="top"></a>

[⬅️ Back to Diagrams Index](./index.md)

- [Back to Architecture Index](../index.md)
- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)
- [Back to Data Access](../data-access/index.md)

# HTTP client 401 redirect flow

Unauthorized responses are handled centrally by the Axios response interceptor in `src/api/httpClient.ts`.

```mermaid
flowchart TD
  A[Axios response error] --> B{status == 401?}
  B -->|no| Z[Reject error]

  B -->|yes| C{Demo session?}
  C -->|yes| Z
  C -->|no| D{On public page?\n/ /login* /auth* /logout*}
  D -->|yes| Z
  D -->|no| E{Request is /api/me probe?}
  E -->|yes| Z
  E -->|no| F[Redirect to /login]
  F --> G[Stop handling for this request]
```

Notes:
- `/api/me` is treated as a probe endpoint and should not force navigation.
- Public pages avoid redirect loops and flicker.

---

[Back to top](#top)
