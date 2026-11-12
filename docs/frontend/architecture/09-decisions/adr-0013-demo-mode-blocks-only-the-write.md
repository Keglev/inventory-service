# ADR-0013: Demo mode walks every inventory dialog and blocks only the write

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-09-23

## Context
Demo mode is a client-side session with no backend account. Its reads reach
the backend anonymously and are admitted by `app.demo-readonly`; every write
needs a USER or ADMIN role, so the backend refuses a demo write with 401. The
HTTP client does not redirect a demo session to the login page on a 401, and
the dialog shows whatever its error mapping makes of the refusal.

Three inventory dialogs guarded the write on the client: delete,
quantity-adjust and price-change take a `readOnly` prop, which
`InventoryDialogs` feeds from `isDemo`. A demo user could open them, pick a
supplier and an item, fill the form and see its validation; a valid submit
stopped before the request and showed the demo message (`common:demoDisabled`).

The create dialog did not. Its hook carried the same guard, but the dialog
never passed `readOnly` to it, so the guard never ran. A demo user's create
went to the backend, came back 401, and the dialog reported a server error.
The rename dialog has no guard at all.

## Decision
Every inventory mutation dialog honors demo mode the same way:

- `InventoryDialogs` passes `isDemo` to the dialog as `readOnly`;
- the dialog stays fully usable: selection, input and client-side validation
  run exactly as for a signed-in user;
- a valid submit stops in the dialog's hook before the request, and the form
  shows `common:demoDisabled`.

The create dialog is wired under this rule now. The backend remains the
authority: the client guard only replaces a refusal the backend would give
anyway with a message that says why.

## Alternatives Considered
- **Remove the guards and rely on the 401**: less code, but the user reads a
  server error for an action that was never allowed, and every demo submit
  costs a request.
- **Hide or disable the entry buttons in demo mode**: the demo could no
  longer show the dialogs, which are a large part of what a reviewer comes to
  see.

## Consequences
- A demo user who creates an item sees the demo message instead of a server
  error, and no request is sent.
- The message appears only after the form is valid; an invalid form shows its
  field errors first, as in the three existing dialogs.
- Rename is the one inventory dialog outside the rule until it is wired; its
  demo writes still end in the backend's 401.
- The supplier dialogs are outside this decision. They take no `readOnly`
  prop and rely on backend authorization
  ([Suppliers domain](../05-domains/suppliers.md)).

## Amendment 2026-11-06: rename wired
Ruled by Carlos (FE-7 A, 2026-11-03). The rename dialog now follows the rule:
`InventoryDialogs` passes `isDemo` as `readOnly`, and `useEditItemForm` stops a
valid submit before the request with `common:demoDisabled`. All five inventory
dialogs honor demo mode; the Consequences line on rename no longer holds. The
supplier dialogs stay outside this decision.

## Amendment 2026-11-12: the supplier dialogs follow the rule
Ruled by Carlos (2026-11-09). The project standards say demo mode is read-only in
every dialog, and the supplier dialogs were the exception this record named: a demo
create or edit went to the backend, came back 401 and showed a server error, and a
demo delete stopped at the ADMIN check with "Only administrators can perform this
action". The three supplier dialogs now honor demo mode the same way as the
inventory dialogs:

- `SuppliersDialogs` passes `isDemo` to the create, edit and delete dialogs as
  `readOnly`, and each dialog hands it to its form hook;
- the dialogs stay fully usable: search, selection, input, validation and the
  confirmation step run as for a signed-in user;
- the write step stops before the request and shows `common:demoDisabled`. In the
  delete dialog this check comes before the ADMIN check, because the demo user's
  role would otherwise produce the role message.

The Consequences line "The supplier dialogs are outside this decision" and the same
sentence in the 2026-11-06 amendment no longer hold; every mutation dialog in the
application now follows this decision.
