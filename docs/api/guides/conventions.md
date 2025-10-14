# API Conventions

Common conventions used across the SmartSupplyPro API:

- Pagination: `page` and `size` query parameters. Responses include `total`, `page`, and `size`.
- Filtering: standard query filters using `filter[field]=value` or `q=` for full-text search.
- Idempotency: use `Idempotency-Key` for non-idempotent operations (POST) where supported.
- Timestamps: ISO 8601 in UTC.

See `redoc/index.html` for concrete schema examples and the canonical OpenAPI spec under `openapi/`.