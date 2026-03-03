<a id="top"></a>

[⬅️ Back to Diagrams Index](../index.md)

- [Back to Architecture Index](../../index.md)
- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)
- [Back to Data Access](../../data-access/index.md)

# List fetching + normalization

Inventory and supplier list fetchers are resilient to multiple backend “envelope” shapes and normalize rows defensively.

```mermaid
flowchart TD
  A[Fetcher called with params] --> B[httpClient.get('/api/<resource>', { params })]
  B --> C{Request succeeded?}

  C -->|no| F[Return empty page\nitems=[] total=0]

  C -->|yes| D[Read response.data as unknown]
  D --> E{Envelope shape?}

  E -->|Plain array| E1[rowsRaw = data]
  E -->|Spring Page| E2[rowsRaw = data.content]
  E -->|Custom| E3[rowsRaw = data.items (or similar)]
  E -->|Other| E4[rowsRaw = []]

  E1 --> G[Normalize each row\n(to<Row> or normalize<Row>)\nfilter nulls]
  E2 --> G
  E3 --> G
  E4 --> G

  G --> H[Compute total\n(totalElements || total || rowsRaw.length)]
  H --> I[Return { items, total, page, pageSize }]
```

This keeps UI tables stable even when the backend response format varies.

---

[Back to top](#top)
