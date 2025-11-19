[⬅️ Back to Layers Overview](./index.md)

# Data Transformation (DTO ↔ Entity)

## Pattern Overview

Services act as transformation boundaries between API contracts (DTOs) and domain models (Entities). This separation protects internal schema from external consumers.

## Inbound Transformation: DTO → Entity

Converting inbound DTOs to domain entities for persistence:

```java
@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {
    
    private final SupplierRepository repository;
    private final SupplierMapper mapper;
    
    @Transactional
    public SupplierDTO create(CreateSupplierDTO dto) {
        // DTO → Entity conversion
        Supplier entity = mapper.toEntity(dto);
        
        // Persist entity
        Supplier saved = repository.save(entity);
        
        // Entity → DTO conversion (for response)
        return mapper.toDTO(saved);
    }
}
```

## Outbound Transformation: Entity → DTO

Converting persisted entities back to DTOs for API responses:

```java
@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {
    
    private final SupplierRepository repository;
    private final SupplierMapper mapper;
    
    @Transactional(readOnly = true)
    public Optional<SupplierDTO> findById(String id) {
        return repository.findById(id)
            .map(mapper::toDTO);  // Entity → DTO
    }
}
```

## Mapper Interface

Mappers handle all transformation logic (typically using MapStruct):

```java
@Mapper(componentModel = "spring")
public interface SupplierMapper {
    
    // Inbound: DTO → Entity
    Supplier toEntity(CreateSupplierDTO dto);
    Supplier toEntity(UpdateSupplierDTO dto);
    
    // Outbound: Entity → DTO
    SupplierDTO toDTO(Supplier entity);
    
    // Collections
    List<SupplierDTO> toDTOList(List<Supplier> entities);
}
```

## Why Separate DTOs from Entities?

### 1. API Versioning
```java
// API v1: DTO with minimal fields
public class SupplierDTOv1 {
    private String id;
    private String name;
    private String contactName;
}

// API v2: DTO with extended fields
public class SupplierDTOv2 {
    private String id;
    private String name;
    private String contactName;
    private String taxId;  // New field
    private List<String> certifications;  // New field
}
```

### 2. Security: Prevent Over-Exposure
```java
// Entity (internal)
public class Supplier {
    private String id;
    private String name;
    private String internalNotes;  // CONFIDENTIAL
    private BigDecimal costPrice;  // CONFIDENTIAL
}

// DTO (public)
public class SupplierDTO {
    private String id;
    private String name;
    // internalNotes and costPrice NOT exposed
}
```

### 3. Flexibility: Change Internal Schema
```java
// Old entity structure
public class Supplier {
    private String contactName;
    private String contactPhone;
}

// New entity structure (refactored)
public class Supplier {
    private Contact contact;  // Nested object
}

// DTO remains unchanged
public class SupplierDTO {
    private String contactName;  // Same external API
    private String contactPhone;
}

// Mapper handles the conversion
@Mapper
public class SupplierMapper {
    public SupplierDTO toDTO(Supplier supplier) {
        SupplierDTO dto = new SupplierDTO();
        dto.setContactName(supplier.getContact().getName());
        dto.setContactPhone(supplier.getContact().getPhone());
        return dto;
    }
}
```

## Complex Transformations

Services may perform additional transformations beyond mapping:

```java
@Service
@RequiredArgsConstructor
public class InventoryItemServiceImpl implements InventoryItemService {
    
    private final InventoryItemRepository repository;
    private final SupplierRepository supplierRepository;
    private final InventoryItemMapper mapper;
    
    @Transactional
    public InventoryItemDTO create(CreateInventoryItemDTO dto) {
        // 1. Validate supplier exists
        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
            .orElseThrow(() -> new NoSuchElementException("Supplier not found"));
        
        // 2. Map DTO to entity
        InventoryItem entity = mapper.toEntity(dto);
        
        // 3. Additional transformation: set supplier reference
        entity.setSupplier(supplier);
        
        // 4. Persist
        InventoryItem saved = repository.save(entity);
        
        // 5. Enhance DTO with computed fields
        InventoryItemDTO result = mapper.toDTO(saved);
        result.setSupplierName(supplier.getName());  // Computed
        result.setTotalValue(saved.getQuantity() * saved.getUnitPrice());  // Computed
        
        return result;
    }
}
```

## Anti-Pattern: Using Entities as DTOs

```java
// ❌ Bad - Entity exposed directly
@RestController
public class SupplierController {
    
    @GetMapping("/{id}")
    public Supplier getSupplier(@PathVariable String id) {
        return repository.findById(id).orElse(null);  // Entity exposed
    }
}
```

## Best Practice: Always Transform

```java
// ✅ Good - Always transform through DTO
@RestController
@RequiredArgsConstructor
public class SupplierController {
    
    private final SupplierService service;
    
    @GetMapping("/{id}")
    public SupplierDTO getSupplier(@PathVariable String id) {
        return service.findById(id)  // Returns DTO
            .orElseThrow(() -> new NoSuchElementException("Not found"));
    }
}
```

---

[⬅️ Back to Layers Overview](./index.md)
