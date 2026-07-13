<a id="top"></a>

[⬅️ Back to UI & UX Building Blocks Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Health check hook

The health feature provides a lightweight polling hook:

- `frontend/src/features/health/hooks/useHealthCheck.ts`

It calls `/api/health` periodically and returns typed status for UI surfaces.

## Behavior

- Performs an initial check on mount
- Polls every 15 minutes
- Measures response time (ms)
- Parses JSON and validates its shape at runtime
- Falls back to “offline” status on any error

## Why runtime validation exists

The hook checks that the response includes:

- `status: string`
- `database: string`
- `timestamp: number`

If the shape is unexpected (non-JSON or missing fields), it treats it as an error and marks offline.

## Typical usage

- `const { health, loading, refetch } = useHealthCheck()`

---

```mermaid
graph TD
  UI[Status surface] --> Hook[useHealthCheck]
  Hook --> Fetch[fetch('/api/health')]
  Fetch --> Parse[JSON parse + runtime shape check]
  Parse --> State[HealthStatus]
```

---

[Back to top](#top)
