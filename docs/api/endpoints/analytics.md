# Analytics API Documentation

**Endpoint Base:** `/api/v1/analytics`  
**Version:** 1.0.0  
**Authentication:** Required (OAuth2 Session)  
**Permissions:** `analytics:read` or higher  

## Overview

The Analytics API provides business intelligence, KPIs, and data insights for the SmartSupplyPro inventory management system. This read-only API delivers real-time metrics, trends, and performance indicators.

## Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/analytics/dashboard` | Dashboard KPIs | ✅ Yes |
| `GET` | `/api/v1/analytics/inventory-trends` | Inventory trend analysis | ✅ Yes |
| `GET` | `/api/v1/analytics/supplier-performance` | Supplier performance metrics | ✅ Yes |
| `GET` | `/api/v1/analytics/stock-analysis` | Stock level analysis | ✅ Yes |
| `GET` | `/api/v1/analytics/financial-summary` | Financial insights | ✅ Yes |

## Endpoint Details

### 📊 Dashboard KPIs

**GET** `/api/v1/analytics/dashboard`

Retrieve key performance indicators for the main dashboard.

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `period` | `string` | No | Time period for metrics | `30d`, `7d`, `1y` |
| `refresh` | `boolean` | No | Force refresh cached data | `true` |

#### Response

```json
{
  "period": "30d",
  "timestamp": "2025-10-08T14:30:00Z",
  "kpis": {
    "totalInventoryValue": {
      "current": 2547890.50,
      "previous": 2398123.75,
      "change": 6.25,
      "trend": "up"
    },
    "totalItems": {
      "current": 1247,
      "previous": 1189,
      "change": 4.88,
      "trend": "up"
    },
    "lowStockItems": {
      "current": 23,
      "previous": 31,
      "change": -25.81,
      "trend": "down"
    },
    "supplierCount": {
      "current": 45,
      "previous": 43,
      "change": 4.65,
      "trend": "up"
    }
  },
  "alerts": [
    {
      "type": "LOW_STOCK",
      "severity": "medium",
      "message": "23 items below reorder level",
      "actionRequired": true
    },
    {
      "type": "HIGH_VALUE_INCREASE",
      "severity": "info",
      "message": "Inventory value increased by 6.25% this period",
      "actionRequired": false
    }
  ]
}
```

### 📈 Inventory Trends

**GET** `/api/v1/analytics/inventory-trends`

Analyze inventory trends over time with various metrics.

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `metric` | `string` | No | Metric to analyze | `value`, `quantity`, `turnover` |
| `period` | `string` | No | Analysis period | `90d`, `1y` |
| `granularity` | `string` | No | Data granularity | `daily`, `weekly`, `monthly` |
| `category` | `string` | No | Filter by category | `electronics` |

#### Response

```json
{
  "metric": "value",
  "period": "90d",
  "granularity": "weekly",
  "data": [
    {
      "date": "2025-07-14",
      "value": 2398123.75,
      "quantity": 1189,
      "categories": {
        "electronics": 1245678.90,
        "furniture": 856234.45,
        "supplies": 296210.40
      }
    }
  ],
  "trends": {
    "overall": {
      "direction": "increasing",
      "rate": 6.25,
      "confidence": 0.87
    },
    "categories": {
      "electronics": { "direction": "increasing", "rate": 8.12 },
      "furniture": { "direction": "stable", "rate": 0.45 },
      "supplies": { "direction": "decreasing", "rate": -2.34 }
    }
  },
  "forecasts": {
    "nextPeriod": {
      "value": 2710234.67,
      "confidence": 0.82,
      "range": {
        "min": 2564123.45,
        "max": 2856345.89
      }
    }
  }
}
```

### 🏢 Supplier Performance

**GET** `/api/v1/analytics/supplier-performance`

Analyze supplier performance metrics and rankings.

#### Response

```json
{
  "period": "90d",
  "suppliers": [
    {
      "supplierId": "supplier-456",
      "supplierName": "Dell Technologies",
      "metrics": {
        "inventoryValue": 856234.45,
        "itemCount": 156,
        "stockTurnover": 4.2,
        "averagePrice": 5489.32,
        "reliability": 0.94
      },
      "performance": {
        "rank": 1,
        "score": 87.5,
        "category": "excellent"
      },
      "trends": {
        "orders": { "count": 24, "change": 12.5 },
        "value": { "total": 856234.45, "change": 8.7 }
      }
    }
  ],
  "summary": {
    "totalSuppliers": 45,
    "avgPerformanceScore": 76.3,
    "topPerformers": 12,
    "underPerformers": 3
  }
}
```

### 📦 Stock Analysis

**GET** `/api/v1/analytics/stock-analysis`

Detailed analysis of stock levels, turnover, and optimization opportunities.

#### Response

```json
{
  "stockLevels": {
    "optimal": { "count": 892, "percentage": 71.5 },
    "lowStock": { "count": 23, "percentage": 1.8 },
    "overstock": { "count": 156, "percentage": 12.5 },
    "outOfStock": { "count": 3, "percentage": 0.2 }
  },
  "turnoverAnalysis": {
    "fast": { "count": 234, "avgTurnover": 8.7 },
    "medium": { "count": 567, "avgTurnover": 4.2 },
    "slow": { "count": 289, "avgTurnover": 1.8 },
    "dead": { "count": 45, "avgTurnover": 0.1 }
  },
  "optimization": {
    "reorderSuggestions": [
      {
        "itemId": "item-789",
        "itemName": "MacBook Pro 16\"",
        "currentStock": 3,
        "suggestedOrder": 15,
        "reason": "Below reorder level, high demand"
      }
    ],
    "overstockItems": [
      {
        "itemId": "item-321",
        "itemName": "Old Desktop Model",
        "currentStock": 45,
        "suggestedAction": "Reduce by 30 units",
        "reason": "Low turnover, high carrying cost"
      }
    ]
  }
}
```

### 💰 Financial Summary

**GET** `/api/v1/analytics/financial-summary`

Financial insights and profitability analysis.

#### Response

```json
{
  "period": "30d",
  "financialMetrics": {
    "totalInventoryValue": 2547890.50,
    "averageItemValue": 2042.18,
    "carryingCosts": 12739.45,
    "turnoverValue": 567890.23
  },
  "profitability": {
    "grossMargin": 32.5,
    "turnoverRate": 6.2,
    "carryingCostRatio": 0.5
  },
  "categoryBreakdown": [
    {
      "category": "electronics",
      "value": 1245678.90,
      "percentage": 48.9,
      "margin": 35.2,
      "turnover": 7.1
    }
  ],
  "trends": {
    "valueGrowth": 6.25,
    "marginImprovement": 2.1,
    "turnoverIncrease": 8.7
  }
}
```

## Data Freshness & Caching

### Cache Strategy
- **Dashboard KPIs**: Refreshed every 15 minutes
- **Trend Analysis**: Refreshed every 1 hour
- **Supplier Performance**: Refreshed every 6 hours
- **Financial Summary**: Refreshed every 4 hours

### Real-time Updates
Certain metrics are updated in real-time:
- Stock level alerts
- Critical low stock notifications
- High-value transactions

## Performance Considerations

### Response Times
- **Dashboard KPIs**: < 200ms (cached)
- **Trend Analysis**: < 2s (computed)
- **Complex Analytics**: < 5s (heavy computation)

### Rate Limiting
- **Analytics Endpoints**: 60 requests per minute per user
- **Dashboard Refresh**: 10 requests per minute per user

## Business Intelligence Features

### Predictive Analytics
- **Demand Forecasting**: ML-based demand prediction
- **Stock Optimization**: Automated reorder suggestions
- **Trend Analysis**: Pattern recognition and trend projection

### Alert System
- **Low Stock Alerts**: Automated notifications
- **Performance Alerts**: Supplier and category performance issues
- **Financial Alerts**: Margin and profitability warnings

---

**Related Documentation:**
- [Inventory Items API](inventory-items.md)
- [Suppliers API](suppliers.md)
- [Stock History API](stock-history.md)