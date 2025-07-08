package com.smartsupplypro.inventory.mapper;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.model.Supplier;

/**
 * Utility class for mapping between {@link Supplier} entities and
 * {@link SupplierDTO} data transfer objects.
 *
 * <p>Used to isolate transformation logic between persistence models
 * and API-facing contract objects, ensuring clean separation of concerns.
 *
 * <p>Commonly applied in:
 * <ul>
 *   <li>REST controllers for supplier operations</li>
 *   <li>Service layer responses to clients</li>
 *   <li>Admin dashboards and reporting tools</li>
 * </ul>
 */
public class SupplierMapper {

    /**
     * Converts a {@link Supplier} entity into a {@link SupplierDTO}.
     *
     * @param supplier the entity retrieved from the database
     * @return a data transfer object used for responses or UI consumption
     */
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

    /**
     * Converts a {@link SupplierDTO} into a {@link Supplier} entity.
     *
     * <p>Primarily used for persisting data from incoming POST/PUT requests.
     *
     * @param dto the input data transfer object
     * @return a Supplier entity ready for persistence
     */
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
// This mapper is designed to be used in service layers where conversion between
// persistence entities and DTOs is required, especially in applications with complex
// business logic or multiple data sources. It ensures that the conversion logic is
// centralized, making it easier to maintain and test. The use of builders allows for
// fluent and readable code, while the explicit mapping of fields ensures that all
// necessary data is transferred correctly between layers. This approach also allows
// for easy extension in the future if additional fields or transformations are needed.