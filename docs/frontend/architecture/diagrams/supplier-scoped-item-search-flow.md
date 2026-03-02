<a id="top"></a>

[⬅️ Back to Diagrams Index](./index.md)

- [Back to Architecture Index](../index.md)
- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)
- [Back to Data Access](../data-access/index.md)

# Supplier-scoped item search

The item type-ahead search is supplier-scoped in the UI. Because the backend does not reliably filter by supplier, the hook applies **client-side filtering**.

```mermaid
flowchart TD
  A[UI calls useItemSearchQuery\n(selectedSupplier, searchQuery)] --> B{enabled?\n(supplier set AND query length ≥ 2)}
  B -->|no| C[Return [] (idle)]
  B -->|yes| D[queryFn]

  D --> E[Call searchItemsForSupplier\n(supplierId, q, limit=500)]
  E --> F[Backend returns items\n(may include other suppliers)]
  F --> G[Client-side filter\nitem.supplierId == selectedSupplier.id]
  G --> H[Map to ItemOption\n{id, name}]
  H --> I[Return filtered options]
```

---

[Back to top](#top)
