package com.smartsupplypro.inventory.converter;

import com.smartsupplypro.inventory.model.Role;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class RoleConverter implements AttributeConverter<Role, String> {

    @Override
    public String convertToDatabaseColumn(Role role) {
        return role == null ? null : role.name();
    }

    @Override
    public Role convertToEntityAttribute(String dbData) {
        System.out.println(">>> Converting DB value: [" + dbData + "]");
        return dbData == null ? null : Role.valueOf(dbData.trim());
    }
    
}
