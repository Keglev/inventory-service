<a id="top"></a>

[⬅️ Back to Diagrams Index](../index.md)

- [Back to Architecture Index](../../index.md)
- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)
- [Back to Data Access](../../data-access/index.md)

# Data fetching flow (React Query)

This diagram shows the typical flow for server-state reads (lists, details, analytics) using React Query hooks and domain fetchers.

```mermaid
sequenceDiagram
  autonumber
  participant UI as Page / Component
  participant RQ as React Query hook
  participant F as Domain fetcher
  participant HC as httpClient (Axios)
  participant BE as Backend API

  UI->>RQ: render + call hook(queryKey, enabled)
  alt enabled = false
    RQ-->>UI: no request (idle)
  else enabled = true
    RQ->>RQ: check cache by queryKey
    alt cached & fresh (staleTime not exceeded)
      RQ-->>UI: return cached data
    else needs fetch
      RQ->>F: queryFn()
      F->>HC: GET/POST ...
      HC->>BE: HTTP request (cookies via withCredentials)
      BE-->>HC: response (data or error)
      alt success
        HC-->>F: response.data
        F->>F: extract envelope + normalize
        F-->>RQ: typed model
        RQ-->>UI: data + status
      else error
        HC-->>F: error
        F-->>RQ: throw or return fallback
        RQ-->>UI: isError / error (or safe empty model)
      end
    end
  end
```

---

[Back to top](#top)
