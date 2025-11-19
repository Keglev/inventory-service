[⬅️ Back to Infrastructure Index](./index.md)

# Data Mapping Layer

The **Data Mapping Layer** provides Entity ↔ DTO transformation utilities. This layer decouples internal domain models from external API contracts.

## MapStruct Mappers

Efficient object transformation using annotations:

```java
@Mapper(componentModel = "spring")
public interface SupplierMapper {
    
    // Entity → DTO
    SupplierDTO toDTO(Supplier supplier);
    
    // DTO → Entity
    Supplier toEntity(CreateSupplierDTO dto);
    
    // List transformation
    List<SupplierDTO> toDTOList(List<Supplier> suppliers);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    void update(UpdateSupplierDTO dto, @MappingTarget Supplier supplier);
}
```

## Manual Mappers

For simple or custom transformations:

```java
@Component
public class InventoryItemMapper {
    
    public InventoryItemDTO toDTO(InventoryItem entity) {
        if (entity == null) return null;
        
        return InventoryItemDTO.builder()
            .id(entity.getId())
            .name(entity.getName())
            .sku(entity.getSku())
            .supplierId(entity.getSupplierId())
            .supplierName(entity.getSupplier().getName())
            .quantity(entity.getQuantity())
            .unitPrice(entity.getUnitPrice())
            .totalValue(entity.getQuantity() * 
                entity.getUnitPrice().doubleValue())
            .createdAt(entity.getCreatedAt())
            .createdBy(entity.getCreatedBy())
            .build();
    }
    
    public InventoryItem toEntity(CreateInventoryItemDTO dto) {
        if (dto == null) return null;
        
        return InventoryItem.builder()
            .id(UUID.randomUUID().toString())
            .name(dto.getName())
            .sku(dto.getSku())
            .supplierId(dto.getSupplierId())
            .quantity(dto.getInitialQuantity())
            .unitPrice(dto.getUnitPrice())
            .build();
    }
}
```

## Mapping Architecture

```
Controller (receives request)
    ↓
CreateSupplierDTO (API input)
    ↓
Mapper.toEntity() ← InventoryItem Mapper
    ↓
Supplier (domain entity)
    ↓
Service logic and persistence
    ↓
Supplier (domain entity)
    ↓
Mapper.toDTO() → SupplierDTO Mapper
    ↓
SupplierDTO (API response)
    ↓
Controller (sends response)
```

---

[⬅️ Back to Infrastructure Index](./index.md)
