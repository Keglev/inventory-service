package com.smartsupplypro.inventory.mapper;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;

import java.math.BigDecimal;

/**
 * Utility class for converting between {@link InventoryItem} entities
 * and {@link InventoryItemDTO} data transfer objects.
 *
 * <p>This mapper supports:
 * <ul>
 *   <li>Frontend/backend DTO transformation</li>
 *   <li>Custom logic (e.g., computed total value)</li>
 *   <li>Explicit control over field mapping</li>
 * </ul>
 *
 * <p>Helps decouple persistence logic from controller and service layers.
 */
public class InventoryItemMapper {

    /**
     * Converts an {@link InventoryItem} entity into a corresponding {@link InventoryItemDTO}.
     *
     * <p>Computes {@code totalValue} by multiplying {@code price × quantity}.
     *
     * @param item the inventory entity to convert
     * @return DTO representation of the entity
     */
    public static InventoryItemDTO toDTO(InventoryItem item) {
        return InventoryItemDTO.builder()
                .id(item.getId())
                .name(item.getName())
                .quantity(item.getQuantity())
                .price(item.getPrice())
                .totalValue(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .supplierId(item.getSupplierId())
                .createdBy(item.getCreatedBy())
                .createdAt(item.getCreatedAt())
                .build();
    }

    /**
     * Converts an {@link InventoryItemDTO} into a corresponding {@link InventoryItem} entity.
     *
     * @param dto the DTO to convert
     * @return Entity representation of the DTO
     */
    public static InventoryItem toEntity(InventoryItemDTO dto) {
        return InventoryItem.builder()
                .id(dto.getId())
                .name(dto.getName())
                .quantity(dto.getQuantity())
                .price(dto.getPrice())
                .supplierId(dto.getSupplierId())
                .createdBy(dto.getCreatedBy())
                .createdAt(dto.getCreatedAt())
                .build();
    }
}
// This mapper is designed to be used in service layers where conversion between
// persistence entities and DTOs is required, especially in applications with complex
// business logic or multiple data sources. It ensures that the conversion logic is
// centralized, making it easier to maintain and test. The use of builders allows for
// fluent and readable code, while the explicit mapping of fields ensures that all
// necessary data is transferred correctly between layers. This approach also allows
// for easy extension in the future if additional fields or transformations are needed.