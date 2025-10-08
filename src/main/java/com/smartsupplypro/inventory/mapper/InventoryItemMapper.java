package com.smartsupplypro.inventory.mapper;

import java.math.BigDecimal;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;

/**
 * Enterprise entity-DTO mapping utility for inventory items with calculated field support.
 * 
 * <p>Provides bidirectional transformation between {@link InventoryItem} entities and 
 * {@link InventoryItemDTO} data transfer objects with enterprise-specific business logic
 * including computed total values and supplier relationship handling.</p>
 * 
 * <p><strong>Enterprise Mapping Features:</strong></p>
 * <ul>
 *   <li><strong>Calculated Fields:</strong> Automatic total value computation (price × quantity)</li>
 *   <li><strong>Relationship Handling:</strong> Safe supplier name extraction with null safety</li>
 *   <li><strong>Audit Field Preservation:</strong> Maintains creation timestamps and user tracking</li>
 *   <li><strong>Service Layer Integration:</strong> Designed for seamless service-controller mapping</li>
 * </ul>
 * 
 * <p><strong>Enterprise Architecture:</strong> This mapper serves as the transformation layer
 * between persistence entities and API DTOs, enabling clean separation of concerns and 
 * supporting multiple presentation formats while maintaining data integrity.</p>
 */
public final class InventoryItemMapper {

    /**
     * Private constructor to prevent instantiation of utility class.
     * 
     * @throws UnsupportedOperationException if instantiation is attempted
     */
    private InventoryItemMapper() {
        throw new UnsupportedOperationException("Utility class - no instances allowed");
    }

    /**
     * Transforms an inventory item entity to a data transfer object with computed fields.
     *
     * <p><strong>Enterprise Transformation Logic:</strong></p>
     * <ul>
     *   <li><strong>Total Value Calculation:</strong> Computes price × quantity automatically</li>
     *   <li><strong>Supplier Name Resolution:</strong> Safely extracts supplier name with null checks</li>
     *   <li><strong>Entity Integrity:</strong> Preserves all entity fields including audit metadata</li>
     *   <li><strong>API Readiness:</strong> Returns DTO optimized for client consumption</li>
     * </ul>
     *
     * <p><strong>Business Rules:</strong> The total value calculation uses BigDecimal precision
     * to ensure financial accuracy for inventory valuation reports and analytics.</p>
     *
     * @param item the inventory entity from persistence layer, must not be null
     * @return DTO with computed fields for API responses and frontend consumption
     * @implNote Uses builder pattern for null safety and performance optimization
     */
    public static InventoryItemDTO toDTO(InventoryItem item) {
        if (item == null) {
            return null;
        }
        
        // Calculate total value with null safety and financial precision
        BigDecimal totalValue = calculateTotalValue(item.getPrice(), item.getQuantity());
        
        // Resolve supplier name with null safety
        String supplierName = resolveSupplierName(item.getSupplier());
        
        return InventoryItemDTO.builder()
                .id(item.getId())
                .name(item.getName())
                .quantity(item.getQuantity())
                .price(item.getPrice())
                .totalValue(totalValue)
                .supplierId(item.getSupplierId())
                .supplierName(supplierName)
                .minimumQuantity(item.getMinimumQuantity())
                .createdBy(item.getCreatedBy())
                .createdAt(item.getCreatedAt())
                .build();
    }

    /**
     * Transforms a data transfer object back to an inventory item entity for persistence.
     *
     * <p><strong>Persistence Preparation Logic:</strong></p>
     * <ul>
     *   <li><strong>Entity Reconstruction:</strong> Maps all DTO fields to entity properties</li>
     *   <li><strong>Persistence Context:</strong> Prepares entity for JPA persistence operations</li>
     *   <li><strong>Audit Field Support:</strong> Preserves creation metadata for entity tracking</li>
     *   <li><strong>Server Authoritative:</strong> Ignores computed fields like totalValue</li>
     * </ul>
     *
     * <p><strong>Design Note:</strong> This method is primarily used for update operations
     * and test data preparation. The supplier relationship is handled separately through
     * the service layer to maintain referential integrity.</p>
     *
     * @param dto the data transfer object from API requests, must not be null
     * @return entity ready for persistence layer operations and database storage
     * @implNote Builder pattern ensures immutability and validation during entity creation
     */
    public static InventoryItem toEntity(InventoryItemDTO dto) {
        if (dto == null) {
            return null;
        }
        
        return InventoryItem.builder()
                .id(dto.getId())
                .name(dto.getName())
                .quantity(dto.getQuantity())
                .price(dto.getPrice())
                .supplierId(dto.getSupplierId())
                .minimumQuantity(dto.getMinimumQuantity())
                .createdBy(dto.getCreatedBy())    // will be overwritten in service if null
                .createdAt(dto.getCreatedAt())    // PrePersist covers nulls
                .build();
    }
    
    /**
     * Calculates total value with financial precision and null safety.
     *
     * <p><strong>Business Rule:</strong> Total value = price × quantity using BigDecimal
     * for financial accuracy. Returns zero for null inputs to prevent calculation errors.</p>
     *
     * @param price the item price (may be null)
     * @param quantity the item quantity (may be null)
     * @return calculated total value or BigDecimal.ZERO for null inputs
     */
    private static BigDecimal calculateTotalValue(BigDecimal price, Integer quantity) {
        if (price == null || quantity == null) {
            return BigDecimal.ZERO;
        }
        return price.multiply(BigDecimal.valueOf(quantity));
    }
    
    /**
     * Resolves supplier name with null safety for relationship handling.
     *
     * <p><strong>Relationship Safety:</strong> Safely navigates through supplier
     * relationship to extract name, returning null for missing associations.</p>
     *
     * @param supplier the supplier entity (may be null)
     * @return supplier name or null if supplier is null
     */
    private static String resolveSupplierName(com.smartsupplypro.inventory.model.Supplier supplier) {
        return supplier != null ? supplier.getName() : null;
    }
}