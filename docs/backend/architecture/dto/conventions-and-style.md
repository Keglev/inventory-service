[⬅️ Back to DTO Hub](./index.md)

# DTO Conventions & Style Guide

## Overview

This document establishes naming, validation, serialization, and design patterns for all DTOs in the project. Consistency enables predictable API contracts and easier client integration.

---

## Naming Conventions

### Class Naming Pattern

```
<DomainName><Purpose>DTO

Examples:
  SupplierDTO                 Full supplier record
  InventoryItemDTO            Full inventory item
  StockHistoryDTO             Stock change audit entry
  DashboardSummaryDTO         KPI aggregation
  FinancialSummaryDTO         P&L period summary
  StockPerSupplierDTO         Supplier distribution
  LowStockItemDTO             Low stock alert
  PriceTrendDTO               Price history point
  StockValueOverTimeDTO       Time series entry
  MonthlyStockMovementDTO     Monthly aggregate
  ItemUpdateFrequencyDTO      Activity metrics
  AppUserProfileDTO           Current user profile (record)
  StockUpdateResultDTO        Enriched stock change result
  ErrorResponse               Error payload
```

### Pattern Breakdown

| Pattern | Use | Example |
|---------|-----|---------|
| `<Entity>DTO` | CRUD record for entity | `SupplierDTO` |
| `<Entity>SummaryDTO` | Aggregated view | `DashboardSummaryDTO` |
| `<Qualifier><Entity>DTO` | Specialized variant | `LowStockItemDTO` |
| `<Qualifier><Noun>DTO` | Projection/aggregate | `StockPerSupplierDTO` |
| `Create<Entity>DTO` | Implicit via validation groups | Used in request validation |
| `Update<Entity>DTO` | Implicit via validation groups | Used in request validation |

### Avoid

```
❌ SupplierVO               (Use DTO, not Value Object naming)
❌ SupplierRequest         (Inconsistent; use DTO suffix)
❌ SupplierResponse        (DTOs work for both request & response)
❌ Supplier_DTO            (Use camelCase, not snake_case)
❌ SupplierDtoV2           (Versioning goes in package, not class name)
```

---

## Field Naming

### Java Convention

All fields use **camelCase** (standard Java convention):

```java
public class SupplierDTO {
    private String id;              // ✅ camelCase
    private String name;            // ✅ camelCase
    private String contactName;     // ✅ camelCase for multi-word
    private String email;           // ✅ camelCase
    private LocalDateTime createdAt; // ✅ camelCase for timestamps
}
```

### JSON Serialization

Jackson serializes Java camelCase → JSON camelCase (standard REST convention):

```json
{
  "id": "SUP-001",           // ← Java: id
  "name": "ACME Corp",       // ← Java: name
  "contactName": "John Doe", // ← Java: contactName
  "email": "acme@example.com", // ← Java: email
  "createdAt": "2025-11-01T08:30:00.000Z"  // ← Java: createdAt
}
```

### Optional Fields Naming

No special prefix. Null handling is explicit via `@NotNull`, `@NotBlank`, etc.:

```java
private String phone;        // Optional—can be null
private String contactName;  // Optional—can be null

@NotBlank(message = "Email is required")
private String email;        // Required—never null
```

---

## Date & Time Handling

### Serialization Format

| Type | Java Class | JSON Format | Example |
|------|-----------|-------------|---------|
| **Date** | `LocalDate` | ISO 8601 `yyyy-MM-dd` | `"2025-11-19"` |
| **DateTime** | `LocalDateTime` | ISO 8601 with time | `"2025-11-19T14:30:00.000Z"` |
| **Timestamp** | `Instant` | ISO 8601 UTC | `"2025-11-19T14:30:00Z"` |

### Timezone Handling

**Rule:** Always use UTC internally. Clients convert to local timezone.

```java
// Backend always uses UTC
@Builder
public class SupplierDTO {
    private LocalDateTime createdAt;  // Stored as LocalDateTime, serialized as ISO-8601
}

// Serialized to JSON (Jackson default):
// "createdAt": "2025-11-01T08:30:00.000Z"

// Client receives and converts to local time (browser/app handles this)
```

### Field Naming Convention

Time-related fields use specific suffixes for clarity:

```java
private LocalDate date;              // ✅ Just date, no time
private LocalDateTime createdAt;     // ✅ "At" for timestamp
private LocalDateTime lastUpdate;    // ✅ Specific event
private String timestamp;            // ✅ Pre-formatted string
```

---

## Numeric Precision

### BigDecimal for Financial Values

Use `BigDecimal` for any monetary amounts, prices, or percentages:

```java
public class InventoryItemDTO {
    @Positive(message = "Price must be > 0")
    private BigDecimal price;           // Price per unit
    
    private BigDecimal totalValue;      // Calculated: quantity × price
}

public class FinancialSummaryDTO {
    private BigDecimal openingValue;
    private BigDecimal purchasesCost;
    private BigDecimal costOfGoodsSold;
}
```

### Integer for Discrete Counts

Use `int` or `Integer` for quantities, counts:

```java
public class InventoryItemDTO {
    @PositiveOrZero
    private int quantity;              // Stock quantity (whole units)
}

public class LowStockItemDTO {
    private int quantity;              // Current stock
    private int minimumQuantity;       // Alert threshold
}
```

### Why BigDecimal?

```
❌ Double:      0.1 + 0.2 = 0.30000000000000004 (floating-point rounding errors)
✅ BigDecimal:  0.1 + 0.2 = 0.3 (exact decimal arithmetic for money)
```

---

## Validation Annotations

### Required Field Pattern

**Strings:** Use `@NotBlank` (rejects empty strings and whitespace)

```java
@NotBlank(message = "Name is required")
private String name;
```

**Objects:** Use `@NotNull` (rejects null references)

```java
@NotNull(message = "Price is mandatory")
private BigDecimal price;
```

### Format Validation

```java
@Email(message = "Invalid email format")
private String email;

@Pattern(regexp = "^\\d{10}$", message = "Phone must be 10 digits")
private String phone;
```

### Range Validation

```java
@Positive(message = "Price must be greater than zero")
private BigDecimal price;

@PositiveOrZero(message = "Quantity must be zero or positive")
private int quantity;

@Min(value = 1, message = "ID must be at least 1")
private Long supplierId;

@Max(value = 9999, message = "Quantity cannot exceed 9999")
private int quantity;
```

### Custom Validation

For domain-specific rules, define custom validators:

```java
@StockUpdateValid  // Custom annotation
public class StockUpdateDTO {
    private int newQuantity;
    private String reason;
}

// In validator class:
@Component
public class StockUpdateValidator implements ConstraintValidator<StockUpdateValid, StockUpdateDTO> {
    public boolean isValid(StockUpdateDTO dto, ConstraintValidatorContext context) {
        // Business logic: e.g., "sold_to_customer" requires adjustment reason
        return dto.getReason() != null || !"sold".equals(dto.getReason());
    }
}
```

### Validation Messages

Use **past-tense or imperative:**

```java
@NotBlank(message = "Name is required")          // ✅ Clear and direct
@NotBlank(message = "Name must not be blank")    // ✅ Alternative (imperative)

@NotBlank(message = "Name cannot be empty")      // ✅ Clear

❌ @NotBlank(message = "Name failed")            // ❌ Vague
❌ @NotBlank(message = "Invalid name")           // ❌ No actionable guidance
```

---

## Optional Fields Policy

### Nullable Fields

Fields without `@NotNull` or `@NotBlank` are **implicitly optional**:

```java
public class SupplierDTO {
    @NotBlank  // Required
    private String name;
    
    // Optional—can be null if not provided
    private String contactName;
    
    // Optional—can be null if not provided
    private String phone;
    
    @Email  // Required to match email format if provided
    private String email;
}
```

### JSON Serialization of Nulls

Include null fields in JSON responses (clients expect consistent shape):

```json
{
  "id": "SUP-001",
  "name": "ACME Corp",
  "contactName": null,        // ← Null fields included
  "phone": null,
  "email": "acme@example.com"
}
```

**Why?** Clients can distinguish "field not provided" (null) from "field not in response" (absent).

---

## Enums in DTOs

### String Serialization

Enums serialize to **String values**, not ordinals:

```java
public enum StockChangeReason {
    RECEIVED("received", "Stock received from supplier"),
    SOLD_TO_CUSTOMER("sold_to_customer", "Sold to customer"),
    DAMAGED("damaged", "Damaged and removed from stock"),
    ADJUSTMENT("adjustment", "Inventory adjustment");
    
    private final String value;
    private final String description;
}

// JSON serialization:
// "reason": "sold_to_customer"  (NOT "1" or "SOLD_TO_CUSTOMER")
```

### Using @JsonProperty

If enum name differs from desired JSON value:

```java
public enum HttpStatus {
    @JsonProperty("bad_request")
    BAD_REQUEST,
    
    @JsonProperty("unauthorized")
    UNAUTHORIZED,
    
    @JsonProperty("forbidden")
    FORBIDDEN
}

// JSON: "error": "bad_request"
```

---

## Record DTOs

For **immutable, read-only DTOs**, use Java records:

```java
public record AppUserProfileDTO(
    String email,
    String fullName,
    String role,
    String pictureUrl
) {}

// Automatically provides:
// - All-args constructor
// - toString()
// - equals() & hashCode()
// - Getter methods (no "get" prefix)
```

### When to Use Records

- ✅ **Read-only data** (no setters)
- ✅ **Immutable responses** (analytics, auth)
- ❌ **Request bodies** (validation groups need @Data or @Builder)

---

## Builder Pattern for Complex DTOs

Use `@Builder` for DTOs with many fields:

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDTO {
    private List<StockPerSupplierDTO> stockPerSupplier;
    private List<LowStockItemDTO> lowStockItems;
    private List<MonthlyStockMovementDTO> monthlyStockMovement;
    private List<ItemUpdateFrequencyDTO> topUpdatedItems;
}

// Usage:
DashboardSummaryDTO dashboard = DashboardSummaryDTO.builder()
    .stockPerSupplier(suppliers)
    .lowStockItems(alerts)
    .monthlyStockMovement(trends)
    .topUpdatedItems(activity)
    .build();
```

---

## Versioning Strategy

### Current Approach: No Versioning

All DTOs are **unversioned** (implicit v1). If breaking changes are needed:

**Option A:** Create new DTO class with version in name

```java
public class InventoryItemDTOV2 {  // For major breaking changes
    // New fields or structure
}

// Map v1 to v2 in controller:
@GetMapping("v2/items")
public ResponseEntity<List<InventoryItemDTOV2>> listV2() { ... }
```

**Option B:** Add new fields and deprecate old ones

```java
public class InventoryItemDTO {
    @Deprecated(forRemoval = true)
    private String oldField;
    
    private String newField;  // Replacement
}
```

---

## Lombok Annotations

### Standard Annotations

```java
@Data              // Generates @Getter, @Setter, @ToString, @EqualsAndHashCode
@Builder           // Generates builder() method
@NoArgsConstructor // Generates zero-argument constructor
@AllArgsConstructor // Generates all-args constructor
@Getter            // Individual getters only (read-only)
@Setter            // Individual setters only
```

### Example: Supplier DTO

```java
@Data                  // Generates getters, setters, toString, equals, hashCode
@Builder               // Enables SupplierDTO.builder()
@NoArgsConstructor     // SupplierDTO()
@AllArgsConstructor    // SupplierDTO(id, name, email, ...)
public class SupplierDTO {
    private String id;
    private String name;
    private String email;
}
```

---

## Serialization Configuration

### Jackson Default Behavior

Jackson (Spring's default JSON serializer) handles:

- ✅ camelCase → camelCase (IDENTITY strategy)
- ✅ null fields → included
- ✅ LocalDateTime → ISO-8601 timestamp
- ✅ BigDecimal → numeric value with precision

### Custom Configuration (if needed)

```java
@Configuration
public class JacksonConfig {
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        // Include nulls
        mapper.setSerializationInclusion(Include.ALWAYS);
        
        // Use ISO-8601 for dates
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        return mapper;
    }
}
```

---

## Best Practices Checklist

```
DTO Design:
  ☑ Class name ends with DTO
  ☑ All fields are camelCase
  ☑ Required fields marked with @NotNull/@NotBlank
  ☑ Monetary values use BigDecimal
  ☑ Dates use LocalDate or LocalDateTime
  ☑ Enums serialize as String values
  ☑ Optional fields have null defaults

Validation:
  ☑ Error messages are actionable (tell user what went wrong)
  ☑ Validation groups used for Create vs Update
  ☑ Custom validators for complex business rules
  ☑ @Email, @Pattern used for format checks

Serialization:
  ☑ Null fields included in JSON responses
  ☑ BigDecimal maintains precision
  ☑ Dates use ISO-8601 format
  ☑ Timezone is always UTC

Documentation:
  ☑ Class-level JavaDoc explains purpose
  ☑ Field-level JavaDoc explains meaning
  ☑ Validation messages are clear
  ☑ @see tags link to entity, controller, service
```

---

## Summary

| Aspect | Rule |
|--------|------|
| **Naming** | `<Domain><Purpose>DTO` |
| **Fields** | camelCase (Java convention) |
| **Dates** | `LocalDate` or `LocalDateTime`, ISO-8601 serialization |
| **Money** | `BigDecimal` (not Double) |
| **Required** | `@NotBlank`, `@NotNull` |
| **Optional** | No annotation (null is OK) |
| **Enums** | Serialize as String values |
| **Records** | For immutable read-only DTOs |
| **Nulls** | Include in JSON (consistent shape) |
| **Validation** | Groups for Create/Update variants |

---

[⬅️ Back to DTO Hub](./index.md)
