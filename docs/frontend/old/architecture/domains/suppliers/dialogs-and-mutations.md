<a id="top"></a>

[⬅️ Back to Suppliers Domain](./index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Suppliers Dialogs & Mutations

Supplier CRUD operations are implemented as dialogs. The board controls dialog visibility, while each dialog owns its own workflow (forms, confirmation steps, submission, error mapping).

## Dialog container

`SuppliersDialogs` is a pure composition component that renders:
- `CreateSupplierDialog`
- `EditSupplierDialog`
- `DeleteSupplierDialog`

It does not contain business logic.

## Create supplier

Component: `dialogs/CreateSupplierDialog/CreateSupplierDialog.tsx`

- Uses React Hook Form + Zod (`useCreateSupplierForm`, `createSupplierSchema`).
- Optional fields (contactName/phone/email) are supported; email is validated if provided.
- Help integration uses the help system topic id `suppliers.manage`.

Error mapping:
- The form logic heuristically maps “duplicate supplier name” errors to the `name` field and shows a generic “fix highlighted fields” message.

## Edit supplier

Component: `dialogs/EditSupplierDialog/EditSupplierDialog.tsx`

Workflow:
1) search and select a supplier
2) edit contact information
3) review changes (opens a confirmation dialog)
4) confirm → submit update

Notes:
- Supplier name is treated as immutable.
- The code documents edit operations as ADMIN-only; final authorization is backend-owned.
- On success, a toast is shown and the board refreshes supplier queries.

## Delete supplier

Component: `dialogs/DeleteSupplierDialog/DeleteSupplierDialog.tsx`

Two-step flow:
1) search/select supplier
2) confirm deletion

Notable behaviors:
- The deletion form hook (`useDeleteSupplierForm`) explicitly checks `user.role === 'ADMIN'` before sending the DELETE request.
- Errors are mapped with heuristics, including a “linked items” business rule.

Backend behavior (as documented in code):
- cannot delete supplier with linked items (often a `409 Conflict`)
- returns `204 No Content` on success

Help topic id used by delete flow: `suppliers.delete`.

## Refresh behavior

After create/edit/delete:
- `useDialogHandlers` invalidates React Query caches under `queryKey: ['suppliers']`
- dialogs are closed
- selection is cleared after edit/delete

## Conceptual flow

```mermaid
flowchart TD
  Toolbar[SuppliersToolbar] --> Open[Open dialog toggle]
  Open --> Dialog[Dialog workflow]
  Dialog --> Validate[Zod + form validation]
  Validate --> Mutate[api/suppliers mutations]
  Mutate --> Invalidate[invalidateQueries(['suppliers'])]
  Invalidate --> Refresh[Suppliers list/search refetch]
```

---

[Back to top](#top)
