---
title: Inventory API Endpoints
---

# Inventory — Endpoints

Light index of Inventory endpoints (generated from OpenAPI tags). Use the ReDoc anchor to jump to details: `../redoc/index.html#tag/Inventory`.

| Method | Path | Summary |
|---|---|---|
| GET | /api/inventory | List all items (non-paginated) |
| POST | /api/inventory | Create item (ADMIN) |
| GET | /api/inventory/{id} | Get item by id |
| POST | /api/inventory/search | Search inventory (query) |
| PATCH | /api/inventory/{id}/quantity | Adjust quantity |
| PATCH | /api/inventory/{id}/price | Update price |

Jump to interactive documentation: [ReDoc — Inventory](../redoc/index.html#tag/Inventory)

---

## GET /api/inventory

Summary: List all items (non-paginated)

Responses:
- 200: application/json — array of InventoryItemDTO

## POST /api/inventory

Summary: Create item (ADMIN)

Request body: InventoryItemDTO (example):

```json
{
	"name": "Steel Wrench",
	"quantity": 25,
	"price": 19.99,
	"supplierId": "sup-001",
	"minimumQuantity": 5
}
```

Responses:
- 201: Created — returns InventoryItemDTO with `id`, `createdAt`, `totalValue`
- 400: Validation error
- 403: Forbidden (requires ADMIN)

## GET /api/inventory/{id}

Path parameters:
- `id` (string) — required

Responses:
- 200: InventoryItemDTO
- 404: Not found

## PUT /api/inventory/{id}

Summary: Full update (ADMIN for some fields)

Request body: InventoryItemDTO (full payload). The server ignores any provided `id` value and uses the path `id`.

Responses:
- 200: Updated InventoryItemDTO
- 403: Forbidden (requires ADMIN)
- 409: Conflict (e.g., duplicate SKU)

## PATCH /api/inventory/{id}/quantity

Summary: Adjust quantity (partial update)

Request body example:

```json
{
	"quantity": 30
}
```

Responses:
- 200: Updated InventoryItemDTO
- 400: Validation error

## PATCH /api/inventory/{id}/price

Summary: Update price

Request body example:

```json
{
	"price": 21.50
}
```

Responses:
- 200: Updated InventoryItemDTO

