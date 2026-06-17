package com.smartsupplypro.inventory.mapper;

import org.springframework.stereotype.Component;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.model.Supplier;

/**
 * Maps between {@link Supplier} entities and their DTO representations.
 *
 * @see SupplierDTO
 */
@Component
public class SupplierMapper {

    public SupplierDTO toDTO(Supplier supplier) {
        if (supplier == null) return null;
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

    /**
     * Converts a supplier DTO to an entity for persistence.
     *
     * <p>String fields are trimmed and empty values normalized to null.
     * Audit fields ({@code createdBy}, {@code createdAt}) are intentionally excluded —
     * the service layer sets them.</p>
     */
    public Supplier toEntity(SupplierDTO dto) {
        if (dto == null) return null;
        return Supplier.builder()
                .id(dto.getId())
                .name(trimOrNull(dto.getName()))
                .contactName(trimOrNull(dto.getContactName()))
                .phone(trimOrNull(dto.getPhone()))
                .email(trimOrNull(dto.getEmail()))
                // service sets createdBy and createdAt; do not copy from DTO
                .build();
    }

    private String trimOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
