package com.smartsupplypro.inventory.mapper;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;

import java.math.BigDecimal;

public class InventoryItemMapper {

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
