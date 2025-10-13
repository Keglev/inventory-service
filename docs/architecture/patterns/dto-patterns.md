# DTO Layer Architecture Patterns

## Overview

This document describes the Data Transfer Object (DTO) patterns, validation strategies, and design principles implemented across the inventory service DTO layer. These patterns ensure consistent data transfer, robust validation, and enterprise-grade analytics capabilities.

## Table of Contents

1. [Core DTO Patterns](#core-dto-patterns)
2. [Validation Group Patterns](#validation-group-patterns)
3. [Analytics DTO Patterns](#analytics-dto-patterns)
4. [Audit Trail Patterns](#audit-trail-patterns)
5. [Financial Calculation Patterns](#financial-calculation-patterns)
6. [Search and Filter Patterns](#search-and-filter-patterns)
7. [Time Series Patterns](#time-series-patterns)
8. [Result Enrichment Patterns](#result-enrichment-patterns)
9. [Record vs Class Patterns](#record-vs-class-patterns)

---

## Core DTO Patterns

### Entity Transfer DTOs
Primary DTOs representing core business entities with full CRUD support.

#### Examples
- `InventoryItemDTO` - Core inventory management
- `SupplierDTO` - Supplier entity management
- `StockHistoryDTO` - Audit trail records

#### Characteristics
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntityDTO {
    /** System-generated identifier. */
    private String id;
    
    /** Business fields with validation. */
    @NotBlank(message = "Field is mandatory")
    private String name;
    
    /** Audit trail fields. */
    private String createdBy;
    private LocalDateTime createdAt;
}
```

### Analytics DTOs
Specialized DTOs for dashboard visualizations and reporting.

#### Examples
- `DashboardSummaryDTO` - Comprehensive metrics aggregation
- `FinancialSummaryDTO` - WAC-based financial reporting
- `StockValueOverTimeDTO` - Time series visualization

#### Characteristics
```java
@Data
@AllArgsConstructor
public class AnalyticsDTO {
    /** Aggregated metrics for visualization. */
    private List<MetricDTO> metrics;
    
    /** Time period identifiers. */
    private String period;
    
    /** Calculated values. */
    private BigDecimal totalValue;
}
```

---

## Validation Group Patterns

### Create vs Update Validation
**Enterprise Pattern**: Separate validation rules for create and update operations while maintaining single DTO.

```java
public class InventoryItemDTO {
    // Validation groups pattern - separate constraints for create vs update operations
    // enabling flexible validation rules while maintaining single DTO for multiple use cases
    public interface Create {}
    public interface Update {}

    /** ID must be null on creation, can exist on update. */
    @Null(message = "ID must be absent when creating", groups = Create.class)
    private String id;

    /** Required for both operations. */
    @NotBlank(message = "Name is mandatory")
    private String name;
}
```

**Usage in Controllers**:
```java
@PostMapping
public ResponseEntity<InventoryItemDTO> create(@Validated(Create.class) @RequestBody InventoryItemDTO dto) {
    // ID validation prevents client-generated IDs
}

@PutMapping("/{id}")
public ResponseEntity<InventoryItemDTO> update(@PathVariable String id, 
                                              @Validated(Update.class) @RequestBody InventoryItemDTO dto) {
    // ID can be present in body for consistency validation
}
```

### Bean Validation Patterns
Standard JSR-303 annotations with custom messages:

```java
/** Required field validation. */
@NotBlank(message = "Field is mandatory")
private String name;

/** Email format validation. */
@Email(message = "Invalid email format")
private String email;

/** Numeric range validation. */
@PositiveOrZero(message = "Quantity must be zero or positive")
private int quantity;

@Positive(message = "Price must be greater than zero")
private BigDecimal price;
```

---

## Analytics DTO Patterns

### Dashboard Aggregation Pattern
**Enterprise Pattern**: Composite DTOs that aggregate multiple analytics components.

```java
/**
 * Dashboard metrics aggregation DTO providing comprehensive inventory analytics.
 * Contains supplier distribution, low stock alerts, trends, and activity summaries.
 */
public class DashboardSummaryDTO {
    /** Stock distribution across all suppliers. */
    private List<StockPerSupplierDTO> stockPerSupplier;
    
    /** Items requiring attention due to low stock. */
    private List<LowStockItemDTO> lowStockItems;
    
    /** Monthly trends for visualization. */
    private List<MonthlyStockMovementDTO> monthlyStockMovement;
    
    /** High-activity items. */
    private List<ItemUpdateFrequencyDTO> topUpdatedItems;
}
```

### Supplier Analytics Pattern
Distribution analysis for supplier performance:

```java
/**
 * Supplier stock distribution DTO for analytics and performance visualization.
 */
public class StockPerSupplierDTO {
    /** Supplier display name for analytics visualization. */
    private String supplierName;
    
    /** Total stock quantity from this supplier. */
    private long totalQuantity;
}
```

### Activity Tracking Pattern
Frequency analysis for operational insights:

```java
/**
 * Item activity tracking DTO showing update frequency for volatility analysis.
 */
public class ItemUpdateFrequencyDTO {
    /** Item name being tracked for activity. */
    private String itemName;
    
    /** Number of update events recorded for this item. */
    private long updateCount;
}
```

---

## Audit Trail Patterns

### Standard Audit Fields
Consistent audit trail implementation across entity DTOs:

```java
/** User who created this record (audit trail). */
private String createdBy;

/** Creation timestamp (system-generated). */
private LocalDateTime createdAt;
```

### Audit Event DTOs
Specialized DTOs for tracking changes:

```java
/**
 * Stock change audit trail DTO capturing inventory modification events.
 */
public class StockHistoryDTO {
    /** Unique audit record identifier. */
    private String id;
    
    /** Inventory item affected by this change. */
    private String itemId;
    
    /** Quantity delta (positive for inbound, negative for outbound). */
    private int change;
    
    /** Reason code for the stock change (enum-based). */
    private String reason;
    
    /** User or process that triggered this change. */
    private String createdBy;
    
    /** When this change was recorded. */
    private LocalDateTime timestamp;
    
    /** Item price at time of change (for value tracking). */
    private BigDecimal priceAtChange;
}
```

---

## Financial Calculation Patterns

### Weighted Average Cost (WAC) Pattern
**Enterprise Pattern**: WAC methodology for consistent financial valuation.

```java
/**
 * Financial period summary DTO using Weighted Average Cost (WAC) methodology.
 */
public class FinancialSummaryDTO {
    // Enterprise Comment: WAC (Weighted Average Cost) methodology - provides consistent valuation
    // across periods by averaging purchase costs, essential for accurate financial reporting
    
    /** Costing method identifier (currently "WAC"). */
    private String method;
    
    /** Period boundaries. */
    private String fromDate;
    private String toDate;
    
    /** Opening balances. */
    private long openingQty;
    private BigDecimal openingValue;
    
    /** Period transactions. */
    private long purchasesQty;
    private BigDecimal purchasesCost;
    
    /** Closing balances. */
    private long endingQty;
    private BigDecimal endingValue;
}
```

### Immutable Event Records
**Enterprise Pattern**: Record types for financial algorithm processing.

```java
/**
 * Immutable stock event record for WAC cost-flow algorithm processing.
 */
public record StockEventRowDTO(
        String itemId,
        String supplierId,
        LocalDateTime createdAt,
        int quantityChange,
        BigDecimal priceAtChange,
        StockChangeReason reason
) {
    // Enterprise Comment: Record pattern for WAC algorithm - immutable event data structure
    // optimizes memory usage and thread safety for financial calculations
}
```

---

## Search and Filter Patterns

### Flexible Filter DTO Pattern
Comprehensive search capabilities with optional fields:

```java
/**
 * Flexible stock history search filter DTO supporting advanced query combinations.
 */
public class StockUpdateFilterDTO {
    /** Optional date range filtering. */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime startDate;
    
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime endDate;
    
    /** Optional entity filters. */
    private String itemName;
    private String supplierId;
    private String createdBy;
    
    /** Optional numeric range filters. */
    private Integer minChange;
    private Integer maxChange;
}
```

**Usage Pattern**:
- All fields optional and combinable
- Date range validation in controller
- Case-insensitive string matching
- Numeric range support

---

## Time Series Patterns

### Date Format Standardization
**Enterprise Pattern**: Consistent date formatting across databases and frontends.

```java
/**
 * Historical price trend DTO for individual inventory items over time.
 */
public class PriceTrendDTO {
    /** Date when price was recorded (yyyy-MM-dd format for SQL compatibility). */
    private String timestamp;
    
    /** Unit purchase price at this point in time. */
    private BigDecimal price;

    // Enterprise Comment: Date format conversion - standardize on yyyy-MM-dd string format
    // for consistent serialization across H2/Oracle databases and frontend charting libraries
    public PriceTrendDTO(LocalDateTime timestamp, BigDecimal price) {
        this.timestamp = timestamp.toLocalDate().toString();
        this.price = price;
    }
}
```

### Time Series Aggregation
Daily snapshots for trend visualization:

```java
/**
 * Time series DTO for inventory valuation trends and analytics visualization.
 */
public class StockValueOverTimeDTO {
    /** Date point for time series (typically daily snapshots). */
    private LocalDate date;
    
    /** Total inventory value on this date (sum of quantity × price). */
    private double totalValue;
}
```

### Monthly Aggregation Pattern
Period-based aggregation for forecasting:

```java
/**
 * Monthly stock movement aggregation DTO for trend analysis and forecasting.
 */
public class MonthlyStockMovementDTO {
    /** Month identifier (YYYY-MM format, e.g., "2025-07"). */
    private String month;
    
    /** Total inbound stock quantity (received, restocked). */
    private long stockIn;
    
    /** Total outbound stock quantity (sold, scrapped) as positive value. */
    private long stockOut;
}
```

---

## Result Enrichment Patterns

### Human-Readable Results
**Enterprise Pattern**: Enrich IDs with display names for reporting.

```java
/**
 * Enriched stock update result DTO with human-readable details for reporting.
 */
public class StockUpdateResultDTO {
    /** Item display name (enriched from ID). */
    private String itemName;
    
    /** Supplier display name (enriched from ID). */
    private String supplierName;
    
    /** Quantity delta (positive inbound, negative outbound). */
    private int change;
    
    /** Stock change reason classification. */
    private String reason;
    
    /** User or process that triggered this change. */
    private String createdBy;
    
    /** When this change was recorded. */
    private LocalDateTime timestamp;
}
```

**Benefits**:
- Eliminates need for frontend ID-to-name mapping
- Optimizes for CSV/Excel exports
- Improves audit report readability
- Reduces API round trips

---

## Record vs Class Patterns

### When to Use Records
Use Java records for:
- **Immutable data structures** (events, calculations)
- **Algorithm processing** (WAC calculations)
- **Value objects** (coordinates, ranges)
- **Performance-critical paths** (memory efficiency)

```java
public record StockEventRowDTO(
    String itemId,
    LocalDateTime createdAt,
    int quantityChange,
    BigDecimal priceAtChange
) {}
```

### When to Use Classes
Use traditional classes for:
- **Entity representations** (full CRUD operations)
- **Mutable DTOs** (user input, form data)
- **Complex validation** (Bean Validation support)
- **Builder patterns** (optional fields)

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItemDTO {
    // Validation groups, builders, etc.
}
```

---

## Alert System Patterns

### Threshold-Based Alerts
Stock level monitoring with configurable thresholds:

```java
/**
 * Low stock alert DTO identifying items below minimum thresholds.
 */
public class LowStockItemDTO {
    /** Item name requiring attention. */
    private String itemName;
    
    /** Current available stock quantity. */
    private int quantity;
    
    /** Minimum threshold (alert triggers when quantity < minimumQuantity). */
    private int minimumQuantity;
}
```

**Alert Logic**:
```java
// Alert condition: quantity < minimumQuantity
if (item.getQuantity() < item.getMinimumQuantity()) {
    // Trigger low stock alert
}
```

---

## Lombok Integration Patterns

### Standard Lombok Annotations
Consistent Lombok usage across DTOs:

```java
// For entity DTOs with builders
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntityDTO {
    // Full mutability with builder support
}

// For simple value DTOs
@Data
@AllArgsConstructor
public class ValueDTO {
    // Immutable with constructor
}

// For getters/setters only
@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class ConfigDTO {
    // Fine-grained control
}
```

---

## Cross-References

### Related Documentation
- [Controller Layer Patterns](/docs/architecture/patterns/controller-patterns.md) - REST API validation integration
- [Service Layer Patterns](/docs/architecture/patterns/service-patterns.md) - DTO to entity mapping
- [Repository Layer Patterns](/docs/architecture/patterns/repository-patterns.md) - Query result projection
- [Validation Patterns](/docs/architecture/patterns/validation-patterns.md) - Bean validation strategies
- [Security Configuration Patterns](/docs/architecture/patterns/security-patterns.md) - OAuth2 authentication for DTO access
- [Configuration Patterns](/docs/architecture/patterns/configuration-patterns.md) - Demo mode and conditional DTO access

### Framework Integration
- **Spring Boot Validation** - `@Validated` with groups
- **Jackson Serialization** - JSON mapping configuration
- **Spring Data** - Projection interfaces
- **MapStruct** - Entity-DTO mapping

### Testing Considerations
- **Validation testing** - Group-specific constraint validation
- **Serialization testing** - JSON round-trip verification
- **Builder testing** - Immutable object construction
- **Record testing** - Equality and hash code verification

---

## Best Practices Summary

### 1. Validation Design
- Use validation groups for create/update distinction
- Provide meaningful error messages
- Validate at API boundary (controllers)

### 2. Immutability Strategy
- Records for algorithm processing and events
- Classes for user input and entity representations
- Builder pattern for optional fields

### 3. Documentation Standards
- Lean JavaDoc (single-line field docs)
- Enterprise comments for complex patterns
- Cross-references to related patterns

### 4. Date/Time Handling
- Standardize on ISO formats
- String formats for database compatibility
- LocalDateTime for precision, LocalDate for aggregation

### 5. Analytics Design
- Aggregate at DTO level for dashboard efficiency
- Enrich with display names for user experience
- Support flexible filtering for ad-hoc queries

---

*Last updated: Step 2 of 6-step hybrid documentation approach*
*Complete DTO layer transformation with lean JavaDoc and enterprise patterns*