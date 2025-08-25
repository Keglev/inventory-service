package com.smartsupplypro.inventory.repository;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.model.Supplier;

/**
 * JPA slice tests for {@link SupplierRepository} backed by an in‑memory database.
 *
 * <p><strong>Purpose</strong></p>
 * <ul>
 *   <li>Verify case‑insensitive exact lookup via {@link SupplierRepository#findByNameIgnoreCase(String)}.</li>
 *   <li>Verify case‑insensitive substring search via {@link SupplierRepository#findByNameContainingIgnoreCase(String)}.</li>
 *   <li>Verify convenience existence checks via {@link SupplierRepository#existsByNameIgnoreCase(String)}.</li>
 * </ul>
 *
 * <p><strong>Design</strong></p>
 * <ul>
 *   <li>Uses {@code @DataJpaTest} for fast, rollback‑per‑test JPA integration tests.</li>
 *   <li>Forces H2 with {@code @AutoConfigureTestDatabase(replace = ANY)} to avoid external DB/Testcontainers.</li>
 *   <li>Seeds via the repository to keep tests framework‑agnostic and portable.</li>
 * </ul>
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY) // force embedded
@ActiveProfiles("test")
class SupplierRepositoryTest {

    @Autowired
    private SupplierRepository supplierRepository;

    /**
     * Utility: persist a supplier with a unique, deterministic id.
     * Other fields are optional for repository‑level tests.
     */
    private Supplier save(String name) {
        Supplier s = Supplier.builder()
                .id("sup-" + UUID.randomUUID()) // avoid rare hash collisions
                .name(name)
                .contactName("John Doe")
                .email(("contact@" + name).toLowerCase() + ".com")
                .phone("+49 123 456")
                .createdBy("admin")
                .build();
        return supplierRepository.save(s);
    }

    // ---------------------------------------------------------------------
    // findByNameIgnoreCase (exact, case-insensitive)
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("findByNameIgnoreCase → exact match only (case-insensitive)")
    void findByNameIgnoreCase_exact_caseInsensitive() {
        save("Acme GmbH");

        assertTrue(supplierRepository.findByNameIgnoreCase("Acme GmbH").isPresent());
        assertTrue(supplierRepository.findByNameIgnoreCase("acme gmbh").isPresent());
        assertTrue(supplierRepository.findByNameIgnoreCase("ACME GMBH").isPresent());

        // exact lookup should NOT match partials
        assertTrue(supplierRepository.findByNameIgnoreCase("Acme").isEmpty());
        assertTrue(supplierRepository.findByNameIgnoreCase("GmbH").isEmpty());
    }

    // ---------------------------------------------------------------------
    // findByNameContainingIgnoreCase (contains, case-insensitive)
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("findByNameContainingIgnoreCase → returns suppliers containing substring (case-insensitive)")
    void findByNameContainingIgnoreCase_shouldReturnMatches() {
        save("SuperCo");
        save("SuperMart");
        save("OtherCompany");

        List<Supplier> results = supplierRepository.findByNameContainingIgnoreCase("super");

        assertEquals(2, results.size(), "Expected two suppliers matching 'super'");
        assertTrue(results.stream().anyMatch(s -> s.getName().equals("SuperCo")));
        assertTrue(results.stream().anyMatch(s -> s.getName().equals("SuperMart")));
    }

    @Test
    @DisplayName("findByNameContainingIgnoreCase → returns empty when no matches")
    void findByNameContainingIgnoreCase_noMatch() {
        save("UnrelatedName");

        List<Supplier> results = supplierRepository.findByNameContainingIgnoreCase("missing");

        assertTrue(results.isEmpty(), "Expected no suppliers for unmatched name");
    }

    // ---------------------------------------------------------------------
    // existsByNameIgnoreCase (exact, case-insensitive)
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("existsByNameIgnoreCase → true for existing name (any case), false otherwise")
    void existsByNameIgnoreCase_trueFalseCases() {
        save("MegaSupply");

        assertTrue(supplierRepository.existsByNameIgnoreCase("megasupply"));
        assertTrue(supplierRepository.existsByNameIgnoreCase("MEGASUPPLY"));

        // partials are not exact
        assertFalse(supplierRepository.existsByNameIgnoreCase("mega"));
        assertFalse(supplierRepository.existsByNameIgnoreCase("unknown"));
    }
}
