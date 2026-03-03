<a id="top"></a>

[⬅️ Back to Dashboard Domain](./index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Dashboard Navigation & Help

Dashboard acts as a “front door” to the main workflows and integrates with the global help system.

## Where it lives

- Page: `frontend/src/pages/dashboard/Dashboard.tsx`
- Help UI: `frontend/src/features/help/components/HelpIconButton.tsx`

## Navigation shortcuts

Dashboard renders three action buttons at the bottom:

- Manage Inventory → `navigate('/inventory')`
- Manage Suppliers → `navigate('/suppliers')`
- View Analytics → `navigate('/analytics/overview')`

Notes:
- These are simple route transitions via `useNavigate()`.
- Any auth/guard behavior is handled by the app’s routing layer (not by Dashboard).

## Help integration

The dashboard header includes a help icon button:

- `HelpIconButton topicId="app.main"`

`HelpIconButton` delegates to `useHelp()` and calls `openHelp(topicId)`.

## i18n

Dashboard uses the `common` namespace and keys such as:
- `dashboard.title`
- `dashboard.actions.manageInventory`
- `dashboard.actions.manageSuppliers`
- `dashboard.actions.viewAnalytics`
- `actions.help`

## Conceptual flow

```mermaid
flowchart LR
  User --> Btns[Action buttons]
  Btns --> Router[react-router navigate]
  Router --> Inventory[/inventory]
  Router --> Suppliers[/suppliers]
  Router --> Analytics[/analytics/overview]

  User --> Help[HelpIconButton]
  Help --> Hook[useHelp]
  Hook --> Open[openHelp('app.main')]
```

---

[Back to top](#top)
