<a id="top"></a>

[⬅️ Back to Diagrams Index](../index.md)

- [Back to Architecture Index](../../index.md)
- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)
- [Back to Data Access](../../data-access/index.md)

# Connectivity + session probes

The frontend uses lightweight probes for “is the backend up?” and “is this session valid?”.

```mermaid
sequenceDiagram
  autonumber
  participant UI as Page / Bootstrapping
  participant Probe as testConnection / checkSession
  participant HC as httpClient (Axios)
  participant BE as Backend API

  alt Connectivity
    UI->>Probe: testConnection()
    Probe->>HC: GET /api/health/db
    HC->>BE: request
    BE-->>HC: 200 or error
    alt 200
      HC-->>Probe: status=200
      Probe-->>UI: true
    else error
      HC-->>Probe: error
      Probe-->>UI: false
    end
  end

  alt Session validity
    UI->>Probe: checkSession()
    Probe->>HC: GET /api/me
    HC->>BE: request
    BE-->>HC: 200 (profile) or 401
    alt 200
      HC-->>Probe: profile
      Probe-->>UI: AppUserProfile
    else 401/other
      HC-->>Probe: error
      Probe-->>UI: null
    end
  end
```

Important boundary:
- `/api/me` is a probe and should not trigger global redirects.

---

[Back to top](#top)
