---
title: Suppliers API Endpoints
---

# Suppliers — Endpoints

Light index of Suppliers endpoints (generated from OpenAPI tags). Use the ReDoc anchor to jump to details: `../redoc/index.html#tag/Suppliers`.

| Method | Path | Summary |
|---|---|---|
| GET | /api/suppliers | List suppliers |
| GET | /api/suppliers/{id} | Get supplier by id |
| POST | /api/suppliers | Create supplier |
| PATCH | /api/suppliers/{id} | Update supplier |
| DELETE | /api/suppliers/{id} | Delete supplier |

Jump to interactive documentation: [ReDoc — Suppliers](../redoc/index.html#tag/Suppliers)

---

## GET /api/suppliers

Summary: List suppliers (supports filtering and pagination in the interactive spec)

## GET /api/suppliers/{id}

Summary: Get supplier by id

## POST /api/suppliers

Summary: Create supplier

Request example:

```json
{
  "name": "ACME Tools GmbH",
  "contactEmail": "sales@acme.example.com"
}
```

## PATCH /api/suppliers/{id}

Summary: Update supplier

## DELETE /api/suppliers/{id}

Summary: Delete supplier (ADMIN)

# Suppliers API Documentation

**Endpoint Base:** `/api/v1/suppliers`  
**Version:** 1.0.0  
**Authentication:** Required (OAuth2 Session)  

## Overview

The Suppliers API manages supplier relationships and vendor information in the SmartSupplyPro system. This API handles supplier profiles, contact information, and supplier-inventory relationships.

## Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/suppliers` | List all suppliers | ✅ Yes |
| `POST` | `/api/v1/suppliers` | Create new supplier | ✅ Yes |
| `GET` | `/api/v1/suppliers/{id}` | Get supplier details | ✅ Yes |
| `PUT` | `/api/v1/suppliers/{id}` | Update supplier | ✅ Yes |
| `DELETE` | `/api/v1/suppliers/{id}` | Delete supplier | ✅ Yes |
| `GET` | `/api/v1/suppliers/{id}/inventory` | Get supplier's inventory items | ✅ Yes |

## Endpoint Details

### 📋 List Suppliers

**GET** `/api/v1/suppliers`

Retrieve a paginated list of all suppliers with optional filtering.

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `page` | `integer` | No | Page number (0-based) | `0` |
| `size` | `integer` | No | Items per page (max 50) | `20` |
| `sort` | `string` | No | Sort field and direction | `name,asc` |
| `search` | `string` | No | Search in name/email | `"Dell"` |
| `active` | `boolean` | No | Filter by active status | `true` |

#### Response Format

```json
{
  "content": [
    {
      "id": "supplier-456",
      "name": "Dell Technologies",
      "contactEmail": "orders@dell.com",
      "contactPhone": "+1-800-DELL-000",
      "address": {
        "street": "One Dell Way",
        "city": "Round Rock",
        "state": "TX",
        "zipCode": "78682",
        "country": "USA"
      },
      "isActive": true,
      "inventoryItemCount": 25,
      "lastOrderDate": "2025-10-01T10:00:00Z",
      "createdDate": "2025-01-15T09:00:00Z"
    }
  ],
  "page": {
    "size": 20,
    "number": 0,
    "totalElements": 45,
    "totalPages": 3
  }
}
```

### ➕ Create Supplier

**POST** `/api/v1/suppliers`

Create a new supplier in the system.

#### Request Body

```json
{
  "name": "Dell Technologies",
  "contactEmail": "orders@dell.com",
  "contactPhone": "+1-800-DELL-000",
  "website": "https://www.dell.com",
  "address": {
    "street": "One Dell Way",
    "city": "Round Rock",
    "state": "TX",
    "zipCode": "78682",
    "country": "USA"
  },
  "paymentTerms": "NET_30",
  "notes": "Primary technology supplier"
}
```

#### Response

**Status:** `201 Created`

```json
{
  "id": "supplier-789",
  "name": "Dell Technologies",
  "contactEmail": "orders@dell.com",
  "contactPhone": "+1-800-DELL-000",
  "website": "https://www.dell.com",
  "address": {
    "street": "One Dell Way",
    "city": "Round Rock",
    "state": "TX",
    "zipCode": "78682",
    "country": "USA"
  },
  "paymentTerms": "NET_30",
  "notes": "Primary technology supplier",
  "isActive": true,
  "inventoryItemCount": 0,
  "createdDate": "2025-10-08T14:30:00Z",
  "lastUpdated": "2025-10-08T14:30:00Z"
}
```

### 🔍 Get Supplier Details

**GET** `/api/v1/suppliers/{id}`

Retrieve detailed information for a specific supplier.

#### Response

```json
{
  "id": "supplier-456",
  "name": "Dell Technologies",
  "contactEmail": "orders@dell.com",
  "contactPhone": "+1-800-DELL-000",
  "website": "https://www.dell.com",
  "address": {
    "street": "One Dell Way",
    "city": "Round Rock",
    "state": "TX",
    "zipCode": "78682",
    "country": "USA"
  },
  "paymentTerms": "NET_30",
  "notes": "Primary technology supplier",
  "isActive": true,
  "inventoryItemCount": 25,
  "totalOrderValue": 125000.00,
  "lastOrderDate": "2025-10-01T10:00:00Z",
  "createdDate": "2025-01-15T09:00:00Z",
  "lastUpdated": "2025-10-07T15:20:00Z"
}
```

### 📦 Get Supplier's Inventory

**GET** `/api/v1/suppliers/{id}/inventory`

Retrieve all inventory items associated with a specific supplier.

#### Response

```json
{
  "supplierId": "supplier-456",
  "supplierName": "Dell Technologies",
  "inventoryItems": [
    {
      "id": "item-123",
      "name": "Dell Laptop XPS 13",
      "sku": "DELL-XPS13-001",
      "category": "electronics",
      "quantity": 25,
      "unitPrice": 1299.99,
      "stockValue": 32499.75,
      "lastUpdated": "2025-10-07T09:15:00Z"
    }
  ],
  "totalItems": 25,
  "totalStockValue": 125000.00
}
```

## Error Handling

### Business Rule Violations

#### Cannot Delete Supplier with Active Inventory
```json
{
  "error": "conflict",
  "message": "Cannot delete supplier 'Dell Technologies' - 25 active inventory items exist",
  "timestamp": "2025-10-08T14:30:00Z",
  "correlationId": "SSP-1728378600-4525"
}
```

#### Duplicate Supplier Name
```json
{
  "error": "conflict",
  "message": "Supplier with name 'Dell Technologies' already exists",
  "timestamp": "2025-10-08T14:30:00Z",
  "correlationId": "SSP-1728378600-4526",
  "resourceType": "Supplier",
  "conflictField": "name",
  "duplicateValue": "Dell Technologies"
}
```

## Business Rules

### Supplier Management
- **Unique Names**: Supplier names must be unique across the system
- **Contact Information**: Either email or phone must be provided
- **Active Status**: Inactive suppliers cannot be assigned to new inventory items
- **Deletion Rules**: Cannot delete suppliers with active inventory items

### Data Validation
- **Email Format**: Contact emails must be valid email addresses
- **Phone Format**: Phone numbers validated against international formats
- **Website URLs**: Website URLs must be valid HTTP/HTTPS URLs
- **Address Validation**: Country codes must be valid ISO 3166-1 alpha-3 codes

---

**Related Documentation:**
- [Inventory Items API](inventory-items.md)
- [Stock History API](stock-history.md)
- [Analytics API](analytics.md)