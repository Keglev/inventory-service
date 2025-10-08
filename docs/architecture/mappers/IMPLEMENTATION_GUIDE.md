# Mapper Layer Implementation Guide

**Version:** 1.0  
**Date:** December 19, 2024  
**Purpose:** Implementation Guidelines and Best Practices for Entity-DTO Mapping  

## Table of Contents

1. [Implementation Guidelines](#implementation-guidelines)
2. [Mapping Strategy Selection](#mapping-strategy-selection)
3. [Business Logic Integration](#business-logic-integration)
4. [Data Quality Implementation](#data-quality-implementation)
5. [Performance Best Practices](#performance-best-practices)
6. [Testing Strategies](#testing-strategies)
7. [Common Patterns and Anti-Patterns](#common-patterns-and-anti-patterns)
8. [Troubleshooting Guide](#troubleshooting-guide)

## Implementation Guidelines

### Core Implementation Principles

1. **Static Utility Pattern**: All mappers use static methods for zero-instance overhead
2. **Builder Pattern Integration**: Leverage Lombok @Builder for immutable object creation
3. **Null Safety First**: Comprehensive null checking at all transformation levels
4. **Business Logic Preservation**: Maintain domain rules during transformation
5. **Audit Trail Integrity**: Preserve complete audit metadata for compliance

### Mapper Class Structure Template

```java
/**
 * Enterprise entity-DTO mapping utility for [DOMAIN] with [KEY_FEATURES].
 * 
 * <p>Provides [TRANSFORMATION_TYPE] between {@link Entity} entities and 
 * {@link DTO} data transfer objects with enterprise [BUSINESS_LOGIC_TYPE]
 * including [SPECIFIC_FEATURES].</p>
 * 
 * <p><strong>Enterprise [DOMAIN] Features:</strong></p>
 * <ul>
 *   <li><strong>[FEATURE_1]:</strong> [DESCRIPTION]</li>
 *   <li><strong>[FEATURE_2]:</strong> [DESCRIPTION]</li>
 *   <li><strong>[FEATURE_3]:</strong> [DESCRIPTION]</li>
 *   <li><strong>[FEATURE_4]:</strong> [DESCRIPTION]</li>
 * </ul>
 * 
 * <p><strong>Enterprise Architecture:</strong> [ARCHITECTURE_DESCRIPTION]</p>
 */
public final class DomainMapper {
    
    // Private constructor prevents instantiation
    private DomainMapper() {
        throw new UnsupportedOperationException("Utility class - no instances allowed");
    }
    
    /**
     * Transforms [ENTITY] to [DTO] with [TRANSFORMATION_FEATURES].
     *
     * <p><strong>Enterprise Transformation Logic:</strong></p>
     * <ul>
     *   <li><strong>[LOGIC_1]:</strong> [DESCRIPTION]</li>
     *   <li><strong>[LOGIC_2]:</strong> [DESCRIPTION]</li>
     * </ul>
     *
     * @param entity the [ENTITY] from [SOURCE_LAYER], must not be null
     * @return DTO optimized for [TARGET_USE_CASE]
     * @implNote [IMPLEMENTATION_DETAILS]
     */
    public static DomainDTO toDTO(DomainEntity entity) {
        if (entity == null) return null;
        
        // Business logic implementation
        // Calculated fields
        // Relationship resolution
        
        return DomainDTO.builder()
            // Field mappings
            .build();
    }
    
    /**
     * Transforms [DTO] to [ENTITY] with [TRANSFORMATION_FEATURES].
     *
     * @param dto the [DTO] from [SOURCE_LAYER], must not be null
     * @return entity ready for [TARGET_USE_CASE]
     * @implNote [IMPLEMENTATION_DETAILS]
     */
    public static DomainEntity toEntity(DomainDTO dto) {
        if (dto == null) return null;
        
        // Data sanitization
        // Server-authoritative field exclusion
        
        return DomainEntity.builder()
            // Field mappings
            .build();
    }
    
    // Private utility methods for complex transformations
}
```

## Mapping Strategy Selection

### Strategy 1: Enrichment-Focused Mapping (Entity → DTO)

**When to Use:**
- REST API responses
- Frontend data binding
- Report generation
- Analytics preparation

**Implementation Pattern:**
```java
public static InventoryItemDTO toDTO(InventoryItem item) {
    if (item == null) return null;
    
    // 1. Calculate derived fields
    BigDecimal totalValue = calculateTotalValue(item.getPrice(), item.getQuantity());
    
    // 2. Resolve relationships
    String supplierName = resolveSupplierName(item.getSupplier());
    
    // 3. Preserve audit metadata
    return InventoryItemDTO.builder()
        .id(item.getId())
        .name(item.getName())
        .price(item.getPrice())
        .quantity(item.getQuantity())
        .totalValue(totalValue)           // ← Calculated field
        .supplierName(supplierName)       // ← Resolved relationship
        .minimumQuantity(item.getMinimumQuantity())
        .createdBy(item.getCreatedBy())   // ← Audit metadata
        .createdAt(item.getCreatedAt())
        .build();
}

private static BigDecimal calculateTotalValue(BigDecimal price, Integer quantity) {
    if (price == null || quantity == null) return BigDecimal.ZERO;
    return price.multiply(BigDecimal.valueOf(quantity));
}

private static String resolveSupplierName(Supplier supplier) {
    return supplier != null ? supplier.getName() : null;
}
```

### Strategy 2: Sanitization-Focused Mapping (DTO → Entity)

**When to Use:**
- API request processing
- Update operations
- Data validation preparation
- Service layer input

**Implementation Pattern:**
```java
public static InventoryItem toEntity(InventoryItemDTO dto) {
    if (dto == null) return null;
    
    return InventoryItem.builder()
        .id(dto.getId())  // May be overridden by service
        .name(dto.getName())
        .price(dto.getPrice())
        .quantity(dto.getQuantity())
        .minimumQuantity(dto.getMinimumQuantity())
        // Excluded calculated fields: totalValue
        // Excluded relationship fields: supplierName (handled by service)
        // Excluded audit fields: createdBy, createdAt (server-authoritative)
        .build();
}
```

### Strategy 3: Audit-Aware Mapping (Compliance Focus)

**When to Use:**
- Audit trail processing
- Compliance reporting
- Historical data analysis
- Regulatory submissions

**Implementation Pattern:**
```java
public static StockHistoryDTO toDTO(StockHistory history) {
    if (history == null) return null;
    
    return StockHistoryDTO.builder()
        .id(history.getId())
        .itemId(history.getItemId())
        .change(history.getChange())
        .reason(transformEnumSafely(history.getReason()))  // ← Enum transformation
        .createdBy(history.getCreatedBy())                 // ← User attribution
        .timestamp(history.getTimestamp())                 // ← Precise timing
        .priceAtChange(history.getPriceAtChange())         // ← Historical context
        .build();
}

private static String transformEnumSafely(StockChangeReason reason) {
    return reason != null ? reason.name() : null;
}
```

## Business Logic Integration

### Calculated Field Implementation

#### Pattern: Financial Calculations with Precision
```java
private static BigDecimal calculateTotalValue(BigDecimal price, Integer quantity) {
    // Null safety check
    if (price == null || quantity == null) {
        return BigDecimal.ZERO;  // Safe default
    }
    
    // Business rule: totalValue = price × quantity
    // Use BigDecimal for financial precision
    return price.multiply(BigDecimal.valueOf(quantity));
}
```

**Best Practices:**
- Always use `BigDecimal` for monetary calculations
- Provide safe defaults for null values
- Document business rules clearly
- Centralize calculation logic for reusability

#### Pattern: Relationship Resolution
```java
private static String resolveSupplierName(Supplier supplier) {
    // Safe navigation through optional relationships
    if (supplier == null) {
        return null;  // Graceful handling of missing relationships
    }
    
    return supplier.getName();
}
```

**Best Practices:**
- Always check for null relationships
- Return null for missing associations (don't throw exceptions)
- Keep resolution logic simple and focused
- Document expected relationship states

### Enum Transformation Strategies

#### Forward Transformation (Enum → String)
```java
public static StockHistoryDTO toDTO(StockHistory history) {
    return StockHistoryDTO.builder()
        .reason(history.getReason() != null ? history.getReason().name() : null)
        .build();
}
```

#### Reverse Transformation (String → Enum)
```java
public static StockHistory toEntity(StockHistoryDTO dto) {
    StockChangeReason reason = null;
    if (dto.getReason() != null) {
        reason = StockChangeReason.valueOf(dto.getReason());  // May throw IllegalArgumentException
    }
    
    return StockHistory.builder()
        .reason(reason)
        .build();
}
```

**Best Practices:**
- Use `enum.name()` for forward transformation (stable string representation)
- Use `Enum.valueOf()` for reverse transformation (strict validation)
- Let `IllegalArgumentException` propagate for validation handling
- Always check for null before transformation

## Data Quality Implementation

### String Sanitization Utility

```java
/**
 * Enterprise string sanitization utility for data quality assurance.
 * Removes whitespace and converts empty strings to null for database consistency.
 */
private static String trimOrNull(String input) {
    if (input == null) {
        return null;  // Preserve null values
    }
    
    String trimmed = input.trim();
    return trimmed.isEmpty() ? null : trimmed;  // Convert empty to null
}
```

### Usage in Entity Transformation
```java
public static Supplier toEntity(SupplierDTO dto) {
    if (dto == null) return null;
    
    return Supplier.builder()
        .name(trimOrNull(dto.getName()))          // ← Sanitized
        .contactName(trimOrNull(dto.getContactName()))
        .phone(trimOrNull(dto.getPhone()))
        .email(trimOrNull(dto.getEmail()))
        .build();
}
```

**Benefits:**
- Consistent string handling across all mappers
- Database optimization (null vs empty string)
- Improved query performance
- Reduced storage overhead

### Multi-Level Null Safety

#### Level 1: Input Validation
```java
public static DomainDTO toDTO(DomainEntity entity) {
    if (entity == null) {
        return null;  // Early return prevents NPE
    }
    // ... transformation logic
}
```

#### Level 2: Field Safety
```java
return DomainDTO.builder()
    .name(entity.getName())  // Individual field null safety
    .description(entity.getDescription())
    .build();
```

#### Level 3: Relationship Safety
```java
String supplierName = entity.getSupplier() != null 
    ? entity.getSupplier().getName() 
    : null;  // Safe navigation
```

## Performance Best Practices

### Static Method Optimization

```java
public final class OptimizedMapper {
    // Prevent instantiation
    private OptimizedMapper() {
        throw new UnsupportedOperationException("Utility class");
    }
    
    // Static methods for zero-instance overhead
    public static DTO toDTO(Entity entity) {
        // Optimized transformation
    }
}
```

### Builder Pattern Efficiency

```java
// Efficient: Single object creation
return DomainDTO.builder()
    .field1(value1)
    .field2(value2)
    .field3(calculateDerivedValue(source))  // Calculate inline
    .build();  // Single allocation

// Avoid: Multiple object creation
DomainDTO dto = new DomainDTO();
dto.setField1(value1);
dto.setField2(value2);
dto.setField3(calculateDerivedValue(source));
return dto;
```

### Lazy Calculation Strategy

```java
public static InventoryItemDTO toDTO(InventoryItem item) {
    // Calculate only when creating DTO (lazy evaluation)
    BigDecimal totalValue = item.getPrice() != null && item.getQuantity() != null
        ? item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
        : BigDecimal.ZERO;
    
    return InventoryItemDTO.builder()
        .totalValue(totalValue)  // Calculated on-demand
        .build();
}
```

## Testing Strategies

### Unit Test Structure

```java
@Test
class InventoryItemMapperTest {
    
    @Test
    void toDTO_WithValidEntity_ShouldMapAllFields() {
        // Given
        Supplier supplier = Supplier.builder()
            .name("Test Supplier")
            .build();
            
        InventoryItem item = InventoryItem.builder()
            .id(1L)
            .name("Test Item")
            .price(new BigDecimal("10.50"))
            .quantity(5)
            .supplier(supplier)
            .build();
        
        // When
        InventoryItemDTO result = InventoryItemMapper.toDTO(item);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("Test Item");
        assertThat(result.getPrice()).isEqualTo(new BigDecimal("10.50"));
        assertThat(result.getQuantity()).isEqualTo(5);
        assertThat(result.getTotalValue()).isEqualTo(new BigDecimal("52.50"));  // 10.50 * 5
        assertThat(result.getSupplierName()).isEqualTo("Test Supplier");
    }
    
    @Test
    void toDTO_WithNullEntity_ShouldReturnNull() {
        // When
        InventoryItemDTO result = InventoryItemMapper.toDTO(null);
        
        // Then
        assertThat(result).isNull();
    }
    
    @Test
    void toDTO_WithNullPriceOrQuantity_ShouldSetTotalValueToZero() {
        // Given
        InventoryItem item = InventoryItem.builder()
            .id(1L)
            .name("Test Item")
            .price(null)  // Null price
            .quantity(5)
            .build();
        
        // When
        InventoryItemDTO result = InventoryItemMapper.toDTO(item);
        
        // Then
        assertThat(result.getTotalValue()).isEqualTo(BigDecimal.ZERO);
    }
}
```

### Integration Test Examples

```java
@Test
void roundTripTransformation_ShouldPreserveData() {
    // Given
    InventoryItemDTO originalDTO = InventoryItemDTO.builder()
        .name("Test Item")
        .price(new BigDecimal("15.75"))
        .quantity(3)
        .minimumQuantity(10)
        .build();
    
    // When: DTO → Entity → DTO
    InventoryItem entity = InventoryItemMapper.toEntity(originalDTO);
    InventoryItemDTO resultDTO = InventoryItemMapper.toDTO(entity);
    
    // Then: Core fields should be preserved
    assertThat(resultDTO.getName()).isEqualTo(originalDTO.getName());
    assertThat(resultDTO.getPrice()).isEqualTo(originalDTO.getPrice());
    assertThat(resultDTO.getQuantity()).isEqualTo(originalDTO.getQuantity());
    assertThat(resultDTO.getMinimumQuantity()).isEqualTo(originalDTO.getMinimumQuantity());
    
    // Note: totalValue will be calculated in the result
    assertThat(resultDTO.getTotalValue()).isEqualTo(new BigDecimal("47.25"));  // 15.75 * 3
}
```

## Common Patterns and Anti-Patterns

### ✅ Good Patterns

#### 1. Null-Safe Calculation
```java
// ✅ Good: Safe calculation with null checks
BigDecimal totalValue = item.getPrice() != null && item.getQuantity() != null
    ? item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
    : BigDecimal.ZERO;
```

#### 2. Clean Field Exclusion
```java
// ✅ Good: Explicitly exclude server-authoritative fields
return Entity.builder()
    .id(dto.getId())
    .name(dto.getName())
    // Intentionally excluded: createdAt, createdBy (server-managed)
    .build();
```

#### 3. Comprehensive Null Safety
```java
// ✅ Good: Multi-level null checking
public static DTO toDTO(Entity entity) {
    if (entity == null) return null;  // Input validation
    
    String relationshipField = entity.getRelation() != null 
        ? entity.getRelation().getName() 
        : null;  // Relationship safety
    
    return DTO.builder()
        .relationshipField(relationshipField)
        .build();
}
```

### ❌ Anti-Patterns

#### 1. Unsafe Calculations
```java
// ❌ Bad: No null safety - will throw NPE
BigDecimal totalValue = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
```

#### 2. Instance Creation
```java
// ❌ Bad: Creating mapper instances
InventoryItemMapper mapper = new InventoryItemMapper();
InventoryItemDTO dto = mapper.toDTO(item);
```

#### 3. Mapping Calculated Fields in Reverse
```java
// ❌ Bad: Mapping calculated fields to entity
return Entity.builder()
    .totalValue(dto.getTotalValue())  // Don't store calculated fields
    .build();
```

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: NullPointerException During Transformation

**Symptoms:**
```
java.lang.NullPointerException at InventoryItemMapper.toDTO(line 45)
```

**Diagnosis:**
- Check for null entity input
- Verify relationship null safety
- Confirm calculated field null handling

**Solution:**
```java
// Add comprehensive null safety
public static InventoryItemDTO toDTO(InventoryItem item) {
    if (item == null) return null;  // Input validation
    
    // Safe relationship resolution
    String supplierName = item.getSupplier() != null 
        ? item.getSupplier().getName() 
        : null;
    
    // Safe calculation
    BigDecimal totalValue = item.getPrice() != null && item.getQuantity() != null
        ? item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
        : BigDecimal.ZERO;
    
    return InventoryItemDTO.builder()
        .supplierName(supplierName)
        .totalValue(totalValue)
        .build();
}
```

#### Issue 2: IllegalArgumentException for Enum Conversion

**Symptoms:**
```
java.lang.IllegalArgumentException: No enum constant StockChangeReason.INVALID_VALUE
```

**Diagnosis:**
- Invalid enum string from client
- Case sensitivity issues
- Enum value not found

**Solution:**
```java
// Add validation and error handling
public static StockHistory toEntity(StockHistoryDTO dto) {
    StockChangeReason reason = null;
    if (dto.getReason() != null) {
        try {
            reason = StockChangeReason.valueOf(dto.getReason().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "Invalid stock change reason: " + dto.getReason() + 
                ". Valid values: " + Arrays.toString(StockChangeReason.values()), e);
        }
    }
    
    return StockHistory.builder()
        .reason(reason)
        .build();
}
```

#### Issue 3: Incorrect Calculated Field Values

**Symptoms:**
- Total value showing as 0.00 when it should have a value
- Inconsistent calculations

**Diagnosis:**
- Null price or quantity values
- Precision issues with BigDecimal
- Missing business logic

**Solution:**
```java
// Robust calculation with debugging
private static BigDecimal calculateTotalValue(BigDecimal price, Integer quantity) {
    if (price == null) {
        log.debug("Price is null, defaulting total value to zero");
        return BigDecimal.ZERO;
    }
    
    if (quantity == null) {
        log.debug("Quantity is null, defaulting total value to zero");
        return BigDecimal.ZERO;
    }
    
    BigDecimal result = price.multiply(BigDecimal.valueOf(quantity));
    log.debug("Calculated total value: {} = {} × {}", result, price, quantity);
    return result;
}
```

---

## Implementation Checklist

When implementing a new mapper, ensure:

- [ ] **Class Structure**: Final class with private constructor
- [ ] **Documentation**: Enterprise-grade JavaDoc for class and methods
- [ ] **Null Safety**: Input validation and relationship safety
- [ ] **Business Logic**: Calculated fields and domain rules
- [ ] **Data Quality**: String sanitization and validation
- [ ] **Audit Handling**: Proper server-authoritative field exclusion
- [ ] **Performance**: Static methods and builder pattern usage
- [ ] **Testing**: Comprehensive unit tests including edge cases
- [ ] **Error Handling**: Graceful null handling and clear error messages

---
*This implementation guide provides comprehensive guidelines for creating robust, performant, and maintainable entity-DTO mappers in the Smart Supply Pro inventory system.*