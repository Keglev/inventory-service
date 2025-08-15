package com.smartsupplypro.inventory.mapper;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.model.Supplier;

/**
 * Utility class for mapping between {@link Supplier} entities and {@link SupplierDTO} DTOs.
 * Static for speed of development and zero tooling overhead.
 */
public final class SupplierMapper {

    private SupplierMapper() { /* no instances */ }

    /**
     * Convert a {@link Supplier} entity to {@link SupplierDTO}.
     *
     * @param supplier entity from persistence (may be null)
     * @return DTO for API/UI consumption (null if input is null)
     */
    public static SupplierDTO toDTO(Supplier supplier) {
        if (supplier == null) return null;
        return SupplierDTO.builder()
                .id(supplier.getId())
                .name(supplier.getName())
                .contactName(supplier.getContactName())
                .phone(supplier.getPhone())
                .email(supplier.getEmail())
                // audit fields are safe to expose in DTO
                .createdBy(supplier.getCreatedBy())
                .createdAt(supplier.getCreatedAt())
                // add these only if your entity has them; otherwise omit
                // .updatedBy(supplier.getUpdatedBy())
                // .updatedAt(supplier.getUpdatedAt())
                .build();
    }

    /**
     * Convert a {@link SupplierDTO} to a new {@link Supplier} entity.
     *
     * <p>Note: server-authoritative fields like {@code id}, {@code createdAt}, {@code createdBy}
     * are typically set by the service. We intentionally do NOT copy createdAt/createdBy here.
     *
     * @param dto incoming DTO (may be null)
     * @return new entity instance (null if input is null)
     */
    public static Supplier toEntity(SupplierDTO dto) {
        if (dto == null) return null;

        // If your Supplier has Lombok @Builder:
        return Supplier.builder()
                .id(dto.getId()) // controller enforces null on create; service may override
                .name(trimOrNull(dto.getName()))
                .contactName(trimOrNull(dto.getContactName()))
                .phone(trimOrNull(dto.getPhone()))
                .email(trimOrNull(dto.getEmail()))
                // DO NOT set createdBy/createdAt from DTO here; service sets those.
                .build();

        // If you DON'T have @Builder on Supplier, use setters instead:
        // Supplier e = new Supplier();
        // e.setId(dto.getId());
        // e.setName(trimOrNull(dto.getName()));
        // e.setContactName(trimOrNull(dto.getContactName()));
        // e.setPhone(trimOrNull(dto.getPhone()));
        // e.setEmail(trimOrNull(dto.getEmail()));
        // return e;
    }

    // small helper to keep DB values clean
    private static String trimOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
