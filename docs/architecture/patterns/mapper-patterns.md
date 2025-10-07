# Mapper Patterns

## Overview

This document describes the **static mapper pattern** used throughout the Smart Supply Pro inventory service for converting between entities and DTOs, highlighting benefits, tradeoffs, and best practices.

---

## Pattern: Static Utility Mappers

### Description

Dedicated mapper classes with static methods that handle conversion between domain entities and Data Transfer Objects (DTOs), promoting immutability and functional programming style.

### Core Implementation

**InventoryItemMapper.java:**
```java
public class InventoryItemMapper {
    
    /**
     * Converts entity to DTO.
     * @param entity inventory item entity
     * @return DTO representation
     */
    public static InventoryItemDTO toDTO(InventoryItem entity) {
        if (entity == null) return null;
        
        InventoryItemDTO dto = new InventoryItemDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setQuantity(entity.getQuantity());
        dto.setPrice(entity.getPrice());
        dto.setSupplierId(entity.getSupplierId());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setUpdatedBy(entity.getUpdatedBy());
        return dto;
    }
    
    /**
     * Converts DTO to entity with audit fields.
     * @param dto source DTO
     * @param username current user
     * @return entity for persistence
     */
    public static InventoryItem toEntity(InventoryItemDTO dto, String username) {
        if (dto == null) return null;
        
        InventoryItem entity = new InventoryItem();
        // Enterprise Comment: Audit Trail Setup
        // ID null for new entities, set by database
        // Timestamps and user populated by @PrePersist/@PreUpdate
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setQuantity(dto.getQuantity());
        entity.setPrice(dto.getPrice());
        entity.setSupplierId(dto.getSupplierId());
        entity.setCreatedBy(username);
        entity.setUpdatedBy(username);
        return entity;
    }
    
    /**
     * Updates entity with DTO values, preserving audit fields.
     * @param entity existing entity
     * @param dto updated data
     * @param username current user
     */
    public static void updateEntity(InventoryItem entity, InventoryItemDTO dto, String username) {
        if (entity == null || dto == null) return;
        
        // Enterprise Comment: Immutable Field Preservation
        // ID, createdAt, createdBy never updated
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setQuantity(dto.getQuantity());
        entity.setPrice(dto.getPrice());
        entity.setSupplierId(dto.getSupplierId());
        entity.setUpdatedBy(username);
        // updatedAt automatically set by @PreUpdate
    }
}
```

---

## Benefits

### 1. Zero Runtime Overhead

**Static methods = no instantiation**
```java
// No mapper instance needed
InventoryItemDTO dto = InventoryItemMapper.toDTO(entity);

// vs instance-based (creates object)
InventoryItemMapper mapper = new InventoryItemMapper();
InventoryItemDTO dto = mapper.toDTO(entity);
```

**Performance:** Static methods avoid object creation overhead, beneficial in high-throughput scenarios.

### 2. Immutability & Thread Safety

**No state = thread-safe by default**
```java
// Can be safely called from multiple threads simultaneously
CompletableFuture<InventoryItemDTO> future1 = 
    CompletableFuture.supplyAsync(() -> InventoryItemMapper.toDTO(entity1));
CompletableFuture<InventoryItemDTO> future2 = 
    CompletableFuture.supplyAsync(() -> InventoryItemMapper.toDTO(entity2));
```

**Benefit:** No synchronization needed, no shared state corruption.

### 3. Simplicity & Clarity

**Functional style with clear intent**
```java
// Service layer usage
List<InventoryItemDTO> dtos = inventoryItemRepository.findAll()
    .stream()
    .map(InventoryItemMapper::toDTO)
    .collect(Collectors.toList());
```

**Readability:** Method reference syntax (`::toDTO`) is concise and expressive.

### 4. Centralized Conversion Logic

**Single source of truth for mapping**
```java
// All conversions use same logic
InventoryItemDTO dto1 = InventoryItemMapper.toDTO(entity); // Controller
InventoryItemDTO dto2 = InventoryItemMapper.toDTO(entity); // Service
InventoryItemDTO dto3 = InventoryItemMapper.toDTO(entity); // Test
```

**Consistency:** No duplication, easier to maintain.

---

## Tradeoffs

### ❌ No Dependency Injection

**Cannot inject services into static methods:**
```java
// PROBLEM: Static methods can't access Spring beans
public class InventoryItemMapper {
    
    // ❌ Cannot do this
    @Autowired
    private SupplierService supplierService;
    
    public static InventoryItemDTO toDTO(InventoryItem entity) {
        // ❌ Can't use supplierService here
    }
}
```

**Solution:** Pass dependencies as parameters when needed:
```java
public static InventoryItemDTO toDTOWithSupplier(
        InventoryItem entity, 
        SupplierService supplierService) {
    
    InventoryItemDTO dto = toDTO(entity);
    if (entity.getSupplierId() != null) {
        dto.setSupplierName(
            supplierService.getById(entity.getSupplierId()).getName()
        );
    }
    return dto;
}

// Usage in service
InventoryItemDTO dto = InventoryItemMapper.toDTOWithSupplier(entity, supplierService);
```

### ❌ Harder to Mock in Tests

**Static methods complicate unit testing:**
```java
// Problem: Can't mock static method behavior
@Test
void testServiceMethod() {
    // ❌ Cannot mock InventoryItemMapper.toDTO()
    InventoryItem entity = new InventoryItem();
    
    // Static method always executes real implementation
    InventoryItemDTO dto = InventoryItemMapper.toDTO(entity);
}
```

**Solution:** Use PowerMock (not recommended) OR design tests to not require mocking:
```java
// Better: Test with real mapper (integration-like)
@Test
void testServiceMethod() {
    // Use real mapper, verify end-to-end conversion
    InventoryItem entity = createTestEntity();
    InventoryItemDTO dto = InventoryItemMapper.toDTO(entity);
    
    assertNotNull(dto);
    assertEquals(entity.getName(), dto.getName());
}
```

### ❌ Tight Coupling to Mapper Classes

**Direct dependency on static class:**
```java
// Service tightly coupled to InventoryItemMapper
public class InventoryItemServiceImpl {
    public InventoryItemDTO getById(String id) {
        InventoryItem entity = repository.findById(id).orElseThrow(...);
        return InventoryItemMapper.toDTO(entity); // Tight coupling
    }
}
```

**Impact:** Changing mapper signature requires updating all call sites.

**Mitigation:** Mappers rarely change; conversion logic is stable.

---

## Alternative Pattern: Instance-Based Mappers

### MapStruct / ModelMapper Approach

**Annotation-driven code generation:**
```java
@Mapper(componentModel = "spring")
public interface InventoryItemMapper {
    
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    InventoryItemDTO toDTO(InventoryItem entity);
    
    InventoryItem toEntity(InventoryItemDTO dto);
}

// Spring automatically generates implementation
@Service
public class InventoryItemServiceImpl {
    
    private final InventoryItemMapper mapper;
    
    @Autowired
    public InventoryItemServiceImpl(InventoryItemMapper mapper) {
        this.mapper = mapper;
    }
    
    public InventoryItemDTO getById(String id) {
        return repository.findById(id)
            .map(mapper::toDTO)
            .orElseThrow(...);
    }
}
```

**Benefits:**
- ✅ Dependency injection supported
- ✅ Easy to mock in tests
- ✅ Looser coupling

**Tradeoffs:**
- ❌ Runtime overhead (mapper instance creation)
- ❌ Additional dependency (MapStruct library)
- ❌ Generated code less transparent
- ❌ Learning curve for annotation syntax

---

## Best Practices

### 1. Null Safety

**Always check for null inputs:**
```java
public static InventoryItemDTO toDTO(InventoryItem entity) {
    if (entity == null) return null;
    // ... mapping logic
}
```

**Alternative: Return Optional**
```java
public static Optional<InventoryItemDTO> toDTOOptional(InventoryItem entity) {
    return entity == null ? 
        Optional.empty() : 
        Optional.of(toDTO(entity));
}
```

### 2. Collection Mapping

**Provide utility methods for lists:**
```java
public static List<InventoryItemDTO> toDTOList(List<InventoryItem> entities) {
    if (entities == null || entities.isEmpty()) {
        return Collections.emptyList();
    }
    return entities.stream()
        .map(InventoryItemMapper::toDTO)
        .collect(Collectors.toList());
}

// Usage
List<InventoryItemDTO> dtos = InventoryItemMapper.toDTOList(entities);
```

### 3. Update vs Create Distinction

**Separate methods for different scenarios:**
```java
// For new entities (createdBy = updatedBy = username)
public static InventoryItem toEntity(InventoryItemDTO dto, String username) {
    InventoryItem entity = new InventoryItem();
    // ... set fields
    entity.setCreatedBy(username);
    entity.setUpdatedBy(username);
    return entity;
}

// For updating existing entities (preserve createdBy)
public static void updateEntity(InventoryItem entity, InventoryItemDTO dto, String username) {
    // ... update fields
    // DO NOT touch entity.setCreatedBy()
    entity.setUpdatedBy(username);
}
```

### 4. Deep Copy Considerations

**Handle nested objects carefully:**
```java
public static SupplierDTO toDTO(Supplier entity) {
    if (entity == null) return null;
    
    SupplierDTO dto = new SupplierDTO();
    // ... map simple fields
    
    // Enterprise Comment: Nested Object Mapping
    // Contact info copied to avoid entity reference leaks
    if (entity.getContactInfo() != null) {
        dto.setContactEmail(entity.getContactInfo().getEmail());
        dto.setContactPhone(entity.getContactInfo().getPhone());
    }
    return dto;
}
```

**Avoid:** Directly exposing entity references in DTOs.

### 5. Bidirectional Mapping Symmetry

**Ensure toDTO/toEntity are inverses:**
```java
@Test
void testMappingSymmetry() {
    // Original entity
    InventoryItem original = createTestEntity();
    
    // Entity -> DTO -> Entity
    InventoryItemDTO dto = InventoryItemMapper.toDTO(original);
    InventoryItem roundTrip = InventoryItemMapper.toEntity(dto, "testUser");
    
    // Verify key fields preserved (ignore audit fields)
    assertEquals(original.getName(), roundTrip.getName());
    assertEquals(original.getQuantity(), roundTrip.getQuantity());
    assertEquals(original.getPrice(), roundTrip.getPrice());
}
```

---

## Common Mapping Scenarios

### Scenario 1: Simple Entity-DTO Conversion

**One-to-one field mapping:**
```java
InventoryItem entity = repository.findById(id).orElseThrow(...);
InventoryItemDTO dto = InventoryItemMapper.toDTO(entity);
return dto;
```

### Scenario 2: Projection (Partial Mapping)

**Only map subset of fields:**
```java
public static InventoryItemSummaryDTO toSummaryDTO(InventoryItem entity) {
    if (entity == null) return null;
    
    InventoryItemSummaryDTO dto = new InventoryItemSummaryDTO();
    dto.setId(entity.getId());
    dto.setName(entity.getName());
    dto.setQuantity(entity.getQuantity());
    // Omit description, timestamps, etc. for performance
    return dto;
}
```

### Scenario 3: Enriched DTO (Join Data)

**Combine multiple entities:**
```java
public static InventoryItemDetailDTO toDetailDTO(
        InventoryItem item,
        Supplier supplier,
        List<StockHistory> history) {
    
    InventoryItemDetailDTO dto = new InventoryItemDetailDTO();
    dto.setId(item.getId());
    dto.setName(item.getName());
    // ... other item fields
    
    dto.setSupplierName(supplier.getName());
    dto.setSupplierContact(supplier.getContactEmail());
    
    dto.setRecentChanges(
        history.stream()
            .map(StockHistoryMapper::toDTO)
            .collect(Collectors.toList())
    );
    
    return dto;
}
```

### Scenario 4: Aggregate Mapping

**Map nested collections:**
```java
public static OrderDTO toDTO(Order order) {
    OrderDTO dto = new OrderDTO();
    dto.setOrderId(order.getId());
    dto.setCustomerId(order.getCustomerId());
    
    // Map order items
    dto.setItems(
        order.getOrderItems().stream()
            .map(OrderItemMapper::toDTO)
            .collect(Collectors.toList())
    );
    
    return dto;
}
```

---

## Testing Strategies

### Unit Testing Mappers

**Test each conversion direction:**
```java
class InventoryItemMapperTest {
    
    @Test
    void toDTO_shouldMapAllFields() {
        // Given
        InventoryItem entity = createTestEntity();
        entity.setId("123");
        entity.setName("Test Item");
        entity.setQuantity(100);
        
        // When
        InventoryItemDTO dto = InventoryItemMapper.toDTO(entity);
        
        // Then
        assertNotNull(dto);
        assertEquals("123", dto.getId());
        assertEquals("Test Item", dto.getName());
        assertEquals(100, dto.getQuantity());
    }
    
    @Test
    void toDTO_shouldReturnNull_whenEntityNull() {
        assertNull(InventoryItemMapper.toDTO(null));
    }
    
    @Test
    void toEntity_shouldSetAuditFields() {
        // Given
        InventoryItemDTO dto = createTestDTO();
        String username = "testUser";
        
        // When
        InventoryItem entity = InventoryItemMapper.toEntity(dto, username);
        
        // Then
        assertEquals(username, entity.getCreatedBy());
        assertEquals(username, entity.getUpdatedBy());
    }
    
    @Test
    void updateEntity_shouldPreserveCreatedBy() {
        // Given
        InventoryItem entity = createTestEntity();
        entity.setCreatedBy("originalUser");
        InventoryItemDTO dto = createTestDTO();
        dto.setName("Updated Name");
        
        // When
        InventoryItemMapper.updateEntity(entity, dto, "updatingUser");
        
        // Then
        assertEquals("Updated Name", entity.getName());
        assertEquals("originalUser", entity.getCreatedBy()); // Preserved
        assertEquals("updatingUser", entity.getUpdatedBy());
    }
}
```

---

## When to Use Static Mappers

### ✅ Use Static Mappers When:

1. **Simple conversions** without external dependencies
2. **High-throughput scenarios** where performance matters
3. **Functional programming style** preferred
4. **No need for mocking** in tests
5. **Centralized logic** more important than flexibility

### ❌ Consider Instance-Based When:

1. **Need dependency injection** for complex mapping logic
2. **Require easy mocking** in unit tests
3. **Loose coupling** is critical
4. **MapStruct/ModelMapper** already in use
5. **Dynamic mapping** based on configuration

---

## Migration Path

### From Static to Instance-Based

**Step 1: Create interface**
```java
public interface InventoryItemMapper {
    InventoryItemDTO toDTO(InventoryItem entity);
    InventoryItem toEntity(InventoryItemDTO dto, String username);
}
```

**Step 2: Implement with MapStruct**
```java
@Mapper(componentModel = "spring")
public interface InventoryItemMapperImpl extends InventoryItemMapper {
    // MapStruct generates implementation
}
```

**Step 3: Inject in services**
```java
@Service
public class InventoryItemServiceImpl {
    private final InventoryItemMapper mapper;
    
    @Autowired
    public InventoryItemServiceImpl(InventoryItemMapper mapper) {
        this.mapper = mapper;
    }
}
```

**Step 4: Replace static calls**
```java
// Before
return InventoryItemMapper.toDTO(entity);

// After
return mapper.toDTO(entity);
```

---

## References

- **MapStruct**: https://mapstruct.org/
- **ModelMapper**: http://modelmapper.org/
- **Related Patterns**: `validation-patterns.md`, `audit-trail.md`

---

*Document Version: 1.0*  
*Last Updated: 2025*  
*Project: Smart Supply Pro Inventory Service*