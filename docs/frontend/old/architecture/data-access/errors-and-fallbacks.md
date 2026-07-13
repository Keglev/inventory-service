<a id="top"></a>

[⬅️ Back to Data Access Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Errors & Fallbacks

The API layer aims to keep failures **user-comprehensible** and to avoid UI crashes caused by unexpected error shapes.

## User-friendly error messages

Inventory utilities include an `errorMessage()` helper that:
- extracts structured messages from Axios-like `response.data` shapes when present
- falls back to status-based messages (e.g., 401/403/404/409/400)
- falls back to `Error.message` or a generic “Request failed”

UI code should display the returned string (toast/snackbar/banner) without exposing raw stack traces.

## Safe fallbacks for list endpoints

Some fetchers are explicitly resilient to network failures by returning “empty page” results:
- `items: []`
- `total: 0`

This prevents DataGrid-like components from breaking during transient connectivity issues.

## Redirect vs error surface

Authentication failures (`401`) are handled centrally in the HTTP client (redirect rules) so feature code doesn’t need to duplicate navigation logic.

---

[Back to top](#top)
