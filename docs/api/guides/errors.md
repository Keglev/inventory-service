# Error Handling and Response Format

SmartSupplyPro APIs return structured JSON error responses with the following fields:

- `timestamp` — ISO 8601 timestamp of the error
- `status` — HTTP status code
- `error` — short error name
- `message` — human readable message
- `path` — request path
- `correlationId` — UUID used for tracing

Example error:

```json
{
  "timestamp": "2025-10-14T12:00:00Z",
  "status": 400,
  "error": "InvalidRequest",
  "message": "Invalid parameter 'page'",
  "path": "/api/v1/inventory",
  "correlationId": "123e4567-e89b-12d3-a456-426614174000"
}
```

For mapping and integration patterns see `../../architecture/mappers/API_INTEGRATION_PATTERNS.md`.