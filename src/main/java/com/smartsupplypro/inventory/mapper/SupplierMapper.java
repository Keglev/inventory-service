package com.smartsupplypro.inventory.mapper;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.model.Supplier;

public class SupplierMapper {
    public static SupplierDTO toDTO(Supplier supplier) {
        return SupplierDTO.builder()
                .id(supplier.getId())
                .name(supplier.getName())
                .contactName(supplier.getContactName())
                .phone(supplier.getPhone())
                .email(supplier.getEmail())
                .createdBy(supplier.getCreatedBy())
                .createdAt(supplier.getCreatedAt())
                .build();
    }

    public static Supplier toEntity(SupplierDTO dto) {
        return Supplier.builder()
                .id(dto.getId())
                .name(dto.getName())
                .contactName(dto.getContactName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .createdBy(dto.getCreatedBy())
                .createdAt(dto.getCreatedAt())
                .build();
    }
}
