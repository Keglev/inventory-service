package com.smartsupplypro.inventory.mapper;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.model.Supplier;

/**
 * Unit tests for {@link SupplierMapper}.
 *
 * <p><strong>Purpose</strong>: Ensure supplier DTO ↔ entity transformations preserve the expected
 * API contract while applying enterprise data-quality rules (null safety and string sanitization).
 *
 * <p><strong>Operations Tested</strong>:</p>
 * <ul>
 *   <li>Null-safety boundaries (null in → null out)</li>
 *   <li>Field mapping for supplier identity + contact information</li>
 *   <li>Audit-field exposure rules (entity → DTO includes audit; DTO → entity excludes audit)</li>
 *   <li>String sanitization (trim, empty → null)</li>
 *   <li>Utility-class constructor guard (no instances)</li>
 * </ul>
 */
class SupplierMapperTest {

    @Test
    @DisplayName("toDTO: null input returns null")
    void toDTO_nullInput_returnsNull() {
        // GIVEN
        Supplier supplier = null;

        // WHEN
        SupplierDTO dto = SupplierMapper.toDTO(supplier);

        // THEN
        assertNull(dto);
    }

    @Test
    @DisplayName("toDTO: maps supplier fields including audit metadata")
    void toDTO_mapsFields_includingAudit() {
        // GIVEN
        LocalDateTime createdAt = LocalDateTime.of(2024, 12, 31, 23, 59, 59);
        Supplier supplier = Supplier.builder()
                .id("sup-1")
                .name("Acme")
                .contactName("Alice")
                .phone("+1-555")
                .email("a@acme.test")
                .createdBy("admin")
                .createdAt(createdAt)
                .build();

        // WHEN
        SupplierDTO dto = SupplierMapper.toDTO(supplier);

        // THEN
        assertNotNull(dto);
        assertEquals("sup-1", dto.getId());
        assertEquals("Acme", dto.getName());
        assertEquals("Alice", dto.getContactName());
        assertEquals("+1-555", dto.getPhone());
        assertEquals("a@acme.test", dto.getEmail());
        assertEquals("admin", dto.getCreatedBy());
        assertEquals(createdAt, dto.getCreatedAt());
    }

    @Test
    @DisplayName("toEntity: null input returns null")
    void toEntity_nullInput_returnsNull() {
        // GIVEN
        SupplierDTO dto = null;

        // WHEN
        Supplier entity = SupplierMapper.toEntity(dto);

        // THEN
        assertNull(entity);
    }

    @Test
    @DisplayName("toEntity: trims strings and normalizes blanks to null; excludes audit fields")
    void toEntity_sanitizesStrings_andExcludesAuditFields() {
        // GIVEN
        // Deliberately include client-supplied audit fields here to prove the mapper ignores them.
        SupplierDTO dto = SupplierDTO.builder()
                .id("sup-2")
                .name("  Acme  ")
                .contactName("   ")
                .phone(null)
                .email("  support@acme.test  ")
                .createdBy("client-supplied-createdBy")
                .createdAt(LocalDateTime.of(2000, 1, 1, 0, 0, 0))
                .build();

        // WHEN
        Supplier entity = SupplierMapper.toEntity(dto);

        // THEN
        assertNotNull(entity);
        assertEquals("sup-2", entity.getId());
        assertEquals("Acme", entity.getName());
        assertNull(entity.getContactName());
        assertNull(entity.getPhone());
        assertEquals("support@acme.test", entity.getEmail());

        // The service layer is authoritative for audit fields; mapper must not copy them from request DTO.
        assertNull(entity.getCreatedBy());
        assertNull(entity.getCreatedAt());
    }

    @Test
    @DisplayName("constructor: utility class cannot be instantiated")
    void constructor_throwsUnsupportedOperationException() throws Exception {
        // GIVEN
        Constructor<SupplierMapper> ctor = SupplierMapper.class.getDeclaredConstructor();
        ctor.setAccessible(true);

        // WHEN
        InvocationTargetException ex = assertThrows(InvocationTargetException.class, ctor::newInstance);

        // THEN
        assertTrue(ex.getCause() instanceof UnsupportedOperationException);
        assertEquals("Utility class - no instances allowed", ex.getCause().getMessage());
    }
}
