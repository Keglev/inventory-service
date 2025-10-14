# Testing and Examples

This page contains quick client-side testing examples (curl / Postman) to exercise the API.

Example: list inventory items (unauthenticated endpoint may require auth depending on deployment)

```bash
curl -X GET "http://localhost:8081/api/v1/inventory" -H "Accept: application/json" --cookie cookies.txt
```

For integration test patterns and backend test reports, see `../../architecture/testing/` which contains architecture-level testing notes that apply to backend services.