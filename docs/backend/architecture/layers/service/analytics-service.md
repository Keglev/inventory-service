[⬅️ Back to Layers Overview](./index.md)

# Analytics Service

## Purpose

Provide business intelligence and financial analysis across inventory operations.

## Key Responsibilities

- Calculate dashboard KPIs (total items, suppliers, stock value)
- Compute financial metrics (total cost, weighted average cost - WAC)
- Analyze inventory trends (movement patterns, low stock)
- Generate price trends and seasonal analysis
- Calculate inventory turnover and efficiency metrics

## Interface Methods

```java
DashboardSummaryDTO getDashboardSummary();
FinancialSummaryDTO getFinancialSummary();
List<PriceTrendDTO> getPriceTrends(LocalDateTime from, LocalDateTime to);
List<LowStockItemDTO> getLowStockItems(int threshold);
List<MonthlyStockMovementDTO> getMonthlyMovements(String itemId);
```

## Calculation Patterns

### WAC (Weighted Average Cost)
$$\text{WAC} = \frac{\text{Total Inventory Cost}}{\text{Total Quantity}} = \text{Average Unit Cost}$$

### Inventory Value
$$\text{Inventory Value} = \sum (\text{Quantity} \times \text{Unit Cost})$$

### Turnover Rate
$$\text{Turnover Rate} = \frac{\text{Total Sales}}{\text{Average Inventory Value}}$$

### Low Stock Alert
Items where current quantity < reorder point

## Exception Handling

- Returns empty results if no data available
- Handles date range validation gracefully
- No exceptions thrown (analytics is non-critical path)

---

[⬅️ Back to Layers Overview](./index.md)
