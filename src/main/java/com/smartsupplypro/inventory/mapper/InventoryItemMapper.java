package com.smartsupplypro.inventory.mapper;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.model.Supplier;

/**
 * Maps between {@link InventoryItem} entities and their DTO representations.
 *
 * @see InventoryItemDTO
 */
@Component
public class InventoryItemMapper {

    /**
     * Converts an inventory item entity to a response DTO.
     *
     * <p>{@code totalValue} is computed as price × quantity rather than mapped directly.
     * {@code supplierName} is resolved from the loaded supplier relationship.</p>
     */
    public InventoryItemDTO toDTO(InventoryItem item) {
        if (item == null) {
            return null;
        }
        return InventoryItemDTO.builder()
                .id(item.getId())
                .name(item.getName())
                .sku(item.getSku())
                .quantity(item.getQuantity())
                .price(item.getPrice())
                .totalValue(calculateTotalValue(item.getPrice(), item.getQuantity()))
                .supplierId(item.getSupplierId())
                .supplierName(resolveSupplierName(item.getSupplier()))
                .minimumQuantity(item.getMinimumQuantity())
                .createdBy(item.getCreatedBy())
                .createdAt(item.getCreatedAt())
                .build();
    }

    public InventoryItem toEntity(InventoryItemDTO dto) {
        if (dto == null) {
            return null;
        }
        return InventoryItem.builder()
                .id(dto.getId())
                .name(dto.getName())
                .sku(dto.getSku())
                .quantity(dto.getQuantity())
                .price(dto.getPrice())
                .supplierId(dto.getSupplierId())
                .minimumQuantity(dto.getMinimumQuantity())
                .createdBy(dto.getCreatedBy())    // overwritten in service if null
                .createdAt(dto.getCreatedAt())    // @PrePersist covers nulls
                .build();
    }

    private BigDecimal calculateTotalValue(BigDecimal price, Integer quantity) {
        if (price == null || quantity == null) {
            return BigDecimal.ZERO;
        }
        return price.multiply(BigDecimal.valueOf(quantity));
    }

    private String resolveSupplierName(Supplier supplier) {
        return supplier != null ? supplier.getName() : null;
    }
}
