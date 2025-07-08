package com.smartsupplypro.inventory.converter;

import com.smartsupplypro.inventory.model.Role;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for mapping the {@link Role} enum to a database column and back.
 *
 * <p>This converter enables seamless persistence of enum values in the database
 * as strings (e.g., "ADMIN", "USER") and reconstruction of enum instances when reading data.
 *
 * <p>Usage is typically automatic in entities with fields of type {@code Role}, provided this
 * converter is either:
 * <ul>
 *   <li>Explicitly declared with {@code @Convert(converter = RoleConverter.class)}</li>
 *   <li>Or set to auto-apply at the entity level</li>
 * </ul>
 */
@Converter(autoApply = false)
public class RoleConverter implements AttributeConverter<Role, String> {

    /**
     * Converts the {@link Role} enum to its string representation for database storage.
     *
     * @param role enum value to be stored
     * @return the role name as a String, or null if input is null
     */
    @Override
    public String convertToDatabaseColumn(Role role) {
        return role == null ? null : role.name();
    }

    /**
     * Converts a string from the database into a {@link Role} enum value.
     *
     * @param dbData the string stored in the database
     * @return the corresponding Role enum, or null if input is null
     * @throws IllegalArgumentException if the string does not match a known Role
     */
    @Override
    public Role convertToEntityAttribute(String dbData) {
        System.out.println(">>> Converting DB value: [" + dbData + "]");
        return dbData == null ? null : Role.valueOf(dbData.trim());
    }
}
// Note: This converter assumes that the database values are always valid Role names.