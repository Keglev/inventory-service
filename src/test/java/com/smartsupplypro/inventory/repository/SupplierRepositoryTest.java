package com.smartsupplypro.inventory.repository;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

/**
 * Integration tests for {@link SupplierRepository} query correctness
 * using {@link org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest}.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class SupplierRepositoryTest {

    @Autowired
    private SupplierRepository supplierRepository;

    private Supplier save(String name) {
        return supplierRepository.save(Supplier.builder()
                .id("sup-" + UUID.randomUUID())
                .name(name)
                .contactName("John Doe")
                .email(("contact@" + name).toLowerCase() + ".com")
                .phone("+49 123 456")
                .createdBy("admin")
                .build());
    }

    /**
     * Case-insensitive exact name lookup behavior.
     */
    @Nested
    class NameLookup {

        @Test
        void should_find_supplier_regardless_of_name_casing() {
            save("Acme GmbH");

            assertTrue(supplierRepository.findByNameIgnoreCase("Acme GmbH").isPresent());
            assertTrue(supplierRepository.findByNameIgnoreCase("acme gmbh").isPresent());
            assertTrue(supplierRepository.findByNameIgnoreCase("ACME GMBH").isPresent());
            // exact lookup must not match partials
            assertTrue(supplierRepository.findByNameIgnoreCase("Acme").isEmpty());
            assertTrue(supplierRepository.findByNameIgnoreCase("GmbH").isEmpty());
        }
    }

    /**
     * Case-insensitive substring name search behavior.
     */
    @Nested
    class NameSearch {

        @Test
        void should_return_matching_suppliers_for_substring_case_insensitive() {
            save("SuperCo");
            save("SuperMart");
            save("OtherCompany");

            List<Supplier> results = supplierRepository.findByNameContainingIgnoreCase("super");

            assertEquals(2, results.size());
            assertTrue(results.stream().anyMatch(s -> s.getName().equals("SuperCo")));
            assertTrue(results.stream().anyMatch(s -> s.getName().equals("SuperMart")));
        }

        @Test
        void should_return_empty_when_no_suppliers_match_substring() {
            save("UnrelatedName");

            assertTrue(supplierRepository.findByNameContainingIgnoreCase("missing").isEmpty());
        }
    }

    /**
     * Case-insensitive existence check behavior.
     */
    @Nested
    class ExistenceCheck {

        @Test
        void should_confirm_existence_for_known_name_regardless_of_case() {
            save("MegaSupply");

            assertTrue(supplierRepository.existsByNameIgnoreCase("megasupply"));
            assertTrue(supplierRepository.existsByNameIgnoreCase("MEGASUPPLY"));
            // partials must not match
            assertFalse(supplierRepository.existsByNameIgnoreCase("mega"));
            assertFalse(supplierRepository.existsByNameIgnoreCase("unknown"));
        }
    }
}
