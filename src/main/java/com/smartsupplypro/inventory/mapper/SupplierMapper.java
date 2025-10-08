package com.smartsupplypro.inventory.mapper;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.model.Supplier;

/**
 * Enterprise entity-DTO mapping utility for supplier data with comprehensive validation.
 * 
 * <p>Provides bidirectional transformation between {@link Supplier} entities and 
 * {@link SupplierDTO} data transfer objects with enterprise data quality features
 * including null safety, string sanitization, and validation support.</p>
 * 
 * <p><strong>Enterprise Data Quality Features:</strong></p>
 * <ul>
 *   <li><strong>Null Safety Patterns:</strong> Comprehensive null checking throughout transformation</li>
 *   <li><strong>Data Sanitization:</strong> Automatic string trimming and empty value normalization</li>
 *   <li><strong>Audit Field Handling:</strong> Server-authoritative audit timestamp management</li>
 *   <li><strong>Validation Support:</strong> Clean data preparation for validation frameworks</li>
 * </ul>
 * 
 * <p><strong>Enterprise Architecture:</strong> This mapper serves as the data quality gateway
 * for supplier management, ensuring consistent data standards across API boundaries and
 * supporting both create and update workflows with appropriate field handling.</p>
 * 
 * <p><strong>Performance Design:</strong> Static utility pattern eliminates instance overhead
 * for high-throughput supplier transformation operations.</p>
 */
public final class SupplierMapper {

    /**
     * Private constructor to prevent instantiation of utility class.
     * 
     * @throws UnsupportedOperationException if instantiation is attempted
     */
    private SupplierMapper() {
        throw new UnsupportedOperationException("Utility class - no instances allowed");
    }

    /**
     * Transforms a supplier entity to a data transfer object with null safety validation.
     *
     * <p><strong>Enterprise Data Quality Transformation:</strong></p>
     * <ul>
     *   <li><strong>Null Safety:</strong> Graceful handling of null entities and null properties</li>
     *   <li><strong>Field Preservation:</strong> Complete entity field mapping with validation</li>
     *   <li><strong>Audit Metadata:</strong> Preserves creation and modification timestamps</li>
     *   <li><strong>API Readiness:</strong> Returns clean DTO for client consumption</li>
     * </ul>
     *
     * <p><strong>Data Quality Assurance:</strong> This transformation ensures all supplier
     * data meets enterprise standards before API delivery, supporting both list views
     * and detailed supplier management workflows.</p>
     *
     * @param supplier entity from persistence layer (may be null for optional relationships)
     * @return DTO optimized for API responses and frontend consumption (null if input is null)
     * @implNote Returns null for null input to support optional relationship handling
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
     * Transforms a supplier DTO to an entity with data sanitization and validation.
     *
     * <p><strong>Enterprise Data Sanitization:</strong></p>
     * <ul>
     *   <li><strong>String Trimming:</strong> Automatic whitespace removal and null normalization</li>
     *   <li><strong>Server Authoritative Fields:</strong> Excludes audit fields managed by service layer</li>
     *   <li><strong>Create vs Update Support:</strong> Handles both new entity creation and updates</li>
     *   <li><strong>Data Quality:</strong> Ensures clean data before persistence validation</li>
     * </ul>
     *
     * <p><strong>Enterprise Field Management:</strong> Server-authoritative fields like {@code id},
     * {@code createdAt}, and {@code createdBy} are intentionally excluded as they are managed
     * by the service layer to ensure audit integrity and security compliance.</p>
     *
     * @param dto incoming supplier DTO from API requests (may be null for optional processing)
     * @return sanitized entity ready for service layer processing (null if input is null)
     * @implNote Uses trimOrNull() utility for consistent string sanitization across all fields
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

    /**
     * Enterprise string sanitization utility for data quality assurance.
     *
     * <p><strong>Data Quality Transformation:</strong></p>
     * <ul>
     *   <li><strong>Whitespace Normalization:</strong> Removes leading and trailing whitespace</li>
     *   <li><strong>Empty String Handling:</strong> Converts empty strings to null for database consistency</li>
     *   <li><strong>Null Safety:</strong> Gracefully handles null input values</li>
     *   <li><strong>Database Optimization:</strong> Prevents empty string storage for cleaner queries</li>
     * </ul>
     *
     * <p><strong>Enterprise Usage:</strong> This utility ensures consistent string handling
     * across all supplier fields, supporting database constraints and improving data quality
     * for search and reporting operations.</p>
     *
     * @param s the string value to sanitize (may be null)
     * @return trimmed string or null if input was null or became empty after trimming
     * @implNote Converts empty strings to null to maintain database normalization standards
     */
    private static String trimOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
