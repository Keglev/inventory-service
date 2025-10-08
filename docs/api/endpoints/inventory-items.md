# Inventory Items API Documentation

**Endpoint Base:** `/api/v1/inventory`  
**Version:** 1.0.0  
**Authentication:** Required (OAuth2 Session)  

## Overview

The Inventory Items API provides comprehensive CRUD operations for managing inventory items in the SmartSupplyPro system. This API handles product information, stock levels, supplier relationships, and inventory tracking.

## Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/inventory` | List all inventory items | ✅ Yes |
| `POST` | `/api/v1/inventory` | Create new inventory item | ✅ Yes |
| `GET` | `/api/v1/inventory/{id}` | Get inventory item details | ✅ Yes |
| `PUT` | `/api/v1/inventory/{id}` | Update inventory item | ✅ Yes |
| `DELETE` | `/api/v1/inventory/{id}` | Delete inventory item | ✅ Yes |
| `GET` | `/api/v1/inventory/search` | Search inventory items | ✅ Yes |
| `POST` | `/api/v1/inventory/bulk` | Bulk operations | ✅ Yes |

## Authentication

All inventory endpoints require authentication via OAuth2 session cookies. Include credentials in your requests:

```javascript
fetch('/api/v1/inventory', {
  credentials: 'include', // Required for session cookies
  headers: {
    'Content-Type': 'application/json'
  }
});
```

## Endpoint Details

### 📋 List Inventory Items

**GET** `/api/v1/inventory`

Retrieve a paginated list of all inventory items with optional filtering and sorting.

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `page` | `integer` | No | Page number (0-based) | `0` |
| `size` | `integer` | No | Items per page (max 100) | `20` |
| `sort` | `string` | No | Sort field and direction | `name,asc` |
| `search` | `string` | No | Search term | `"laptop"` |
| `category` | `string` | No | Filter by category | `"electronics"` |
| `supplierId` | `string` | No | Filter by supplier | `"supplier-123"` |
| `minStock` | `integer` | No | Minimum stock level | `10` |
| `maxStock` | `integer` | No | Maximum stock level | `100` |

#### Response Format

```json
{
  "content": [
    {
      "id": "item-123",
      "name": "Dell Laptop XPS 13",
      "description": "High-performance ultrabook",
      "sku": "DELL-XPS13-001",
      "category": "electronics",
      "quantity": 25,
      "unitPrice": 1299.99,
      "supplier": {
        "id": "supplier-456",
        "name": "Dell Technologies",
        "contactEmail": "orders@dell.com"
      },
      "lastUpdated": "2025-10-08T14:30:00Z",
      "createdDate": "2025-09-15T10:00:00Z"
    }
  ],
  "page": {
    "size": 20,
    "number": 0,
    "totalElements": 150,
    "totalPages": 8
  }
}
```

#### Example Usage

```bash
# Get first page of inventory items
curl -X GET "http://localhost:8081/api/v1/inventory?page=0&size=20" \
  --cookie-jar cookies.txt

# Search for electronics with low stock
curl -X GET "http://localhost:8081/api/v1/inventory?category=electronics&maxStock=10" \
  --cookie-jar cookies.txt
```

### ➕ Create Inventory Item

**POST** `/api/v1/inventory`

Create a new inventory item in the system.

#### Request Body

```json
{
  "name": "Dell Laptop XPS 13",
  "description": "High-performance ultrabook for business use",
  "sku": "DELL-XPS13-001",
  "category": "electronics",
  "quantity": 25,
  "unitPrice": 1299.99,
  "supplierId": "supplier-456",
  "reorderLevel": 5,
  "maxStockLevel": 100
}
```

#### Response

**Status:** `201 Created`

```json
{
  "id": "item-789",
  "name": "Dell Laptop XPS 13",
  "description": "High-performance ultrabook for business use",
  "sku": "DELL-XPS13-001",
  "category": "electronics",
  "quantity": 25,
  "unitPrice": 1299.99,
  "supplier": {
    "id": "supplier-456",
    "name": "Dell Technologies",
    "contactEmail": "orders@dell.com"
  },
  "reorderLevel": 5,
  "maxStockLevel": 100,
  "createdDate": "2025-10-08T14:30:00Z",
  "lastUpdated": "2025-10-08T14:30:00Z"
}
```

#### Validation Rules

- `name`: Required, 1-100 characters
- `sku`: Required, unique across system
- `quantity`: Required, non-negative integer
- `unitPrice`: Required, positive decimal
- `supplierId`: Required, must reference existing supplier
- `category`: Optional, alphanumeric string

### 🔍 Get Inventory Item

**GET** `/api/v1/inventory/{id}`

Retrieve detailed information for a specific inventory item.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Unique inventory item identifier |

#### Response

**Status:** `200 OK`

```json
{
  "id": "item-123",
  "name": "Dell Laptop XPS 13",
  "description": "High-performance ultrabook",
  "sku": "DELL-XPS13-001",
  "category": "electronics",
  "quantity": 25,
  "unitPrice": 1299.99,
  "supplier": {
    "id": "supplier-456",
    "name": "Dell Technologies",
    "contactEmail": "orders@dell.com",
    "phoneNumber": "+1-800-DELL-000"
  },
  "reorderLevel": 5,
  "maxStockLevel": 100,
  "stockValue": 32499.75,
  "lastStockMovement": {
    "date": "2025-10-07T09:15:00Z",
    "type": "INBOUND",
    "quantity": 10,
    "reason": "Purchase order received"
  },
  "createdDate": "2025-09-15T10:00:00Z",
  "lastUpdated": "2025-10-07T09:15:00Z"
}
```

### ✏️ Update Inventory Item

**PUT** `/api/v1/inventory/{id}`

Update an existing inventory item. Supports partial updates.

#### Request Body

```json
{
  "name": "Dell Laptop XPS 13 (Updated)",
  "quantity": 30,
  "unitPrice": 1199.99,
  "reorderLevel": 8
}
```

#### Response

**Status:** `200 OK`

Returns the updated inventory item with the same structure as the GET response.

### 🗑️ Delete Inventory Item

**DELETE** `/api/v1/inventory/{id}`

Delete an inventory item from the system.

#### Response

**Status:** `204 No Content`

#### Business Rules

- Cannot delete items with active purchase orders
- Cannot delete items with recent stock movements (last 30 days)
- Soft delete preserves historical data

### 🔍 Search Inventory Items

**GET** `/api/v1/inventory/search`

Advanced search functionality with multiple filter criteria.

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `q` | `string` | Full-text search query | `"Dell laptop"` |
| `fields` | `string` | Fields to search (comma-separated) | `"name,description,sku"` |
| `filters` | `string` | JSON filter object | `{"category":"electronics","minStock":10}` |
| `sort` | `string` | Sort criteria | `"relevance,desc"` |

#### Example Usage

```bash
# Full-text search for "laptop" in electronics category
curl -X GET "http://localhost:8081/api/v1/inventory/search?q=laptop&filters={\"category\":\"electronics\"}" \
  --cookie-jar cookies.txt
```

### 📦 Bulk Operations

**POST** `/api/v1/inventory/bulk`

Perform bulk operations on multiple inventory items.

#### Request Body

```json
{
  "operation": "UPDATE_QUANTITIES",
  "items": [
    {
      "id": "item-123",
      "quantity": 30
    },
    {
      "id": "item-456", 
      "quantity": 15
    }
  ]
}
```

#### Supported Operations

- `UPDATE_QUANTITIES` - Update stock quantities
- `UPDATE_PRICES` - Update unit prices
- `ASSIGN_SUPPLIER` - Assign new supplier
- `UPDATE_CATEGORIES` - Update item categories

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "bad_request",
  "message": "Validation failed: 2 field error(s)",
  "timestamp": "2025-10-08T14:30:00Z",
  "correlationId": "SSP-1728378600-4521",
  "fieldErrors": {
    "sku": "SKU already exists in the system",
    "quantity": "Quantity must be non-negative"
  }
}
```

#### 404 Not Found
```json
{
  "error": "not_found",
  "message": "Inventory item not found",
  "timestamp": "2025-10-08T14:30:00Z",
  "correlationId": "SSP-1728378600-4522"
}
```

#### 409 Conflict
```json
{
  "error": "conflict",
  "message": "Inventory item with SKU 'DELL-XPS13-001' already exists",
  "timestamp": "2025-10-08T14:30:00Z",
  "correlationId": "SSP-1728378600-4523",
  "resourceType": "InventoryItem",
  "conflictField": "sku",
  "duplicateValue": "DELL-XPS13-001"
}
```

## Business Rules

### Stock Management
- **Reorder Alerts**: Automatic notifications when quantity falls below reorder level
- **Maximum Stock**: Warnings when attempting to exceed maximum stock level
- **Stock Movements**: All quantity changes are tracked in stock history
- **Negative Stock**: Not allowed (validation prevents negative quantities)

### Supplier Integration
- **Supplier Validation**: All items must have a valid supplier reference
- **Supplier Deletion**: Cannot delete suppliers with active inventory items
- **Supplier Updates**: Changes to supplier information are reflected in inventory items

### Data Integrity
- **SKU Uniqueness**: SKUs must be unique across the entire system
- **Price Validation**: Unit prices must be positive values
- **Category Standards**: Categories follow predefined taxonomy
- **Audit Trail**: All changes are logged for compliance and tracking

## Performance Considerations

### Caching Strategy
- **Item Details**: Individual items cached for 15 minutes
- **Search Results**: Search results cached for 5 minutes
- **Supplier Data**: Supplier information cached for 1 hour

### Pagination
- **Default Page Size**: 20 items
- **Maximum Page Size**: 100 items
- **Total Count**: Provided in pagination metadata

### Rate Limiting
- **Search Requests**: 30 requests per minute per user
- **Bulk Operations**: 5 requests per minute per user
- **General API**: 100 requests per minute per user

---

**Related Documentation:**
- [Suppliers API](suppliers.md)
- [Stock History API](stock-history.md)
- [Analytics API](analytics.md)
- [Error Handling Guide](../integration/error-handling.md)