package com.smartsupplypro.inventory.repository;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

/**
 * Integration tests for {@link SupplierRepository} query correctness
 * using {@link org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest}.
 */
@DataJpaTest(showSql = false)
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
        void should_find_the_supplier_when_the_name_case_differs() {
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
        void should_return_matching_suppliers_when_a_substring_matches_in_any_case() {
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
}
