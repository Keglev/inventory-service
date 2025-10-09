# Stock History API

**Stock Movement Tracking & Audit Trail**

*Complete stock history management with append-only audit logging and movement tracking capabilities.*

> 📋 **Append-only audit trail** for complete stock movement history  
> 🔍 **Advanced filtering** by date ranges, users, and item types  
> 📊 **Movement analytics** for inventory optimization  

---

## 🎯 Overview

The Stock History API provides comprehensive tracking of all inventory movements within the SmartSupplyPro system. This service maintains an append-only audit trail that records every stock change with full context and metadata.

### Key Features

- **📋 Audit Trail**: Complete record of all stock movements
- **🔍 Advanced Search**: Filter by multiple criteria
- **📊 Movement Analytics**: Stock movement patterns and trends
- **🔒 Data Integrity**: Immutable history records
- **📈 Trend Analysis**: Movement velocity and patterns

---

## 🌐 API Endpoints

### Stock History Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stock-history` | **Retrieve stock history** with filtering |
| `GET` | `/api/stock-history/item/{itemId}` | **Get history for specific item** |
| `GET` | `/api/stock-history/summary` | **Movement summary statistics** |
| `GET` | `/api/stock-history/trends` | **Stock movement trends** |

---

## 📋 Endpoint Details

### Get Stock History

**GET** `/api/stock-history`

Retrieve stock movement history with advanced filtering capabilities.

#### Query Parameters

```yaml
parameters:
  - name: itemId
    type: integer
    description: Filter by specific inventory item
    required: false
  - name: startDate
    type: string
    format: date-time
    description: Filter movements after this date
    required: false
  - name: endDate
    type: string
    format: date-time
    description: Filter movements before this date
    required: false
  - name: changeType
    type: string
    enum: [INCREASE, DECREASE, ADJUSTMENT]
    description: Filter by type of change
    required: false
  - name: page
    type: integer
    description: Page number (0-based)
    default: 0
  - name: size
    type: integer
    description: Page size
    default: 20
  - name: sort
    type: string
    description: Sort field and direction
    default: "changeDate,desc"
```

#### Response Format

```json
{
  "content": [
    {
      "id": 1,
      "itemId": 123,
      "itemName": "Product A",
      "changeType": "INCREASE",
      "previousQuantity": 50,
      "newQuantity": 75,
      "quantityChange": 25,
      "changeDate": "2025-10-09T10:30:00Z",
      "changedBy": "user@example.com",
      "reason": "Purchase order received",
      "referenceNumber": "PO-2025-001"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": {
      "sorted": true,
      "orderBy": "changeDate,desc"
    }
  },
  "totalElements": 150,
  "totalPages": 8,
  "first": true,
  "last": false
}
```

### Get Item History

**GET** `/api/stock-history/item/{itemId}`

Retrieve complete stock movement history for a specific inventory item.

#### Path Parameters

- `itemId` (integer, required): The ID of the inventory item

#### Response Format

```json
{
  "itemId": 123,
  "itemName": "Product A",
  "currentQuantity": 75,
  "totalMovements": 45,
  "history": [
    {
      "id": 1,
      "changeType": "INCREASE",
      "previousQuantity": 50,
      "newQuantity": 75,
      "quantityChange": 25,
      "changeDate": "2025-10-09T10:30:00Z",
      "changedBy": "user@example.com",
      "reason": "Purchase order received",
      "referenceNumber": "PO-2025-001"
    }
  ],
  "summary": {
    "totalIncreases": 25,
    "totalDecreases": 20,
    "totalAdjustments": 5,
    "averageChangeSize": 12.5,
    "lastMovementDate": "2025-10-09T10:30:00Z"
  }
}
```

### Movement Summary

**GET** `/api/stock-history/summary`

Get aggregated statistics about stock movements.

#### Query Parameters

```yaml
parameters:
  - name: period
    type: string
    enum: [DAILY, WEEKLY, MONTHLY, YEARLY]
    description: Aggregation period
    default: MONTHLY
  - name: startDate
    type: string
    format: date
    description: Start date for summary
    required: false
  - name: endDate
    type: string
    format: date
    description: End date for summary
    required: false
```

#### Response Format

```json
{
  "period": "MONTHLY",
  "dateRange": {
    "start": "2025-09-01",
    "end": "2025-10-09"
  },
  "totalMovements": 324,
  "movementsByType": {
    "INCREASE": 156,
    "DECREASE": 142,
    "ADJUSTMENT": 26
  },
  "averageMovementsPerDay": 8.7,
  "topActiveItems": [
    {
      "itemId": 123,
      "itemName": "Product A",
      "movementCount": 15
    }
  ],
  "movementTrends": [
    {
      "date": "2025-10-01",
      "movementCount": 12,
      "totalQuantityChanged": 450
    }
  ]
}
```

---

## 🔒 Security & Permissions

### Required Roles

- **Read Access**: `ROLE_USER`, `ROLE_ADMIN`
- **All Operations**: Standard user access sufficient

### Security Features

- **📋 Audit Logging**: All API access logged
- **🔒 Data Protection**: Read-only historical data
- **👤 User Context**: Movement attribution tracking
- **🕒 Timestamp Integrity**: Immutable timestamps

---

## 📊 Business Logic

### Movement Types

- **INCREASE**: Stock additions (purchases, returns)
- **DECREASE**: Stock reductions (sales, waste)
- **ADJUSTMENT**: Manual corrections and audits

### Data Integrity

- **Append-Only**: History records never modified
- **Sequential Tracking**: Chronological order maintained
- **User Attribution**: Every change tracked to user
- **Reference Linking**: Connection to source transactions

---

## 🧪 Testing Examples

### Retrieve Recent History

```bash
curl -X GET "https://api.smartsupplypro.com/api/stock-history?size=10" \
  -H "Authorization: Bearer your-token"
```

### Get Item Movement History

```bash
curl -X GET "https://api.smartsupplypro.com/api/stock-history/item/123" \
  -H "Authorization: Bearer your-token"
```

### Movement Summary for Last Month

```bash
curl -X GET "https://api.smartsupplypro.com/api/stock-history/summary?period=MONTHLY" \
  -H "Authorization: Bearer your-token"
```

---

## 🔗 Related Documentation

- **📦 [Inventory Items API](inventory-items.md)** - Main inventory management
- **📊 [Analytics API](analytics.md)** - Business intelligence features
- **🏢 [Suppliers API](suppliers.md)** - Supplier management
- **🔐 [Authentication API](authentication.md)** - OAuth2 security

---

*Stock History API documentation - Updated October 2025*