package com.smartsupplypro.inventory.mapper;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.model.Supplier;

/**
 * Unit tests for {@link SupplierMapper} bidirectional mapping correctness.
 */
@SuppressWarnings("unused")
class SupplierMapperTest {

    private final SupplierMapper mapper = new SupplierMapper();

    /**
     * Mapping from {@link Supplier} entity to {@link SupplierDTO}.
     */
    @Nested
    @SuppressWarnings("unused")
    class ToDTO {

        @Test
        void should_return_null_for_null_input() {
            assertNull(mapper.toDTO(null));
        }

        @Test
        void should_map_all_fields_including_audit_metadata() {
            LocalDateTime ts = LocalDateTime.of(2024, 12, 31, 23, 59);
            Supplier supplier = Supplier.builder()
                    .id("s-1").name("Acme").contactName("Alice")
                    .phone("+1-555").email("a@acme.test")
                    .createdBy("admin").createdAt(ts).build();
            SupplierDTO dto = mapper.toDTO(supplier);
            assertNotNull(dto);
            assertEquals("s-1", dto.getId());
            assertEquals("Acme", dto.getName());
            assertEquals("Alice", dto.getContactName());
            assertEquals("admin", dto.getCreatedBy());
            assertEquals(ts, dto.getCreatedAt());
        }

        @Test
        void should_preserve_null_optional_contact_fields() {
            Supplier supplier = Supplier.builder()
                    .id("s-2").name("Minimal").createdBy("sys")
                    .contactName(null).phone(null).email(null).build();
            SupplierDTO dto = mapper.toDTO(supplier);
            assertNull(dto.getContactName());
            assertNull(dto.getPhone());
            assertNull(dto.getEmail());
        }
    }

    /**
     * Mapping from {@link SupplierDTO} to {@link Supplier} entity.
     */
    @Nested
    @SuppressWarnings("unused")
    class ToEntity {

        @Test
        void should_return_null_for_null_input() {
            assertNull(mapper.toEntity(null));
        }

        @Test
        void should_trim_and_normalize_blank_strings_to_null() {
            SupplierDTO dto = SupplierDTO.builder()
                    .id("s-3").name("  Acme  ").contactName("   ")
                    .phone(null).email("  a@acme.test  ").build();
            Supplier entity = mapper.toEntity(dto);
            assertEquals("Acme", entity.getName());
            assertNull(entity.getContactName());
            assertNull(entity.getPhone());
            assertEquals("a@acme.test", entity.getEmail());
        }

        @Test
        void should_not_include_audit_fields_from_dto() {
            // Audit fields must not be copied from the DTO; the service layer sets them
            SupplierDTO dto = SupplierDTO.builder()
                    .id("s-4").name("Acme")
                    .createdBy("client-user")
                    .createdAt(LocalDateTime.of(2000, 1, 1, 0, 0)).build();
            Supplier entity = mapper.toEntity(dto);
            assertNull(entity.getCreatedBy());
            assertNull(entity.getCreatedAt());
        }
    }
}
