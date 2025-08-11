package com.smartsupplypro.inventory.repository;

import com.smartsupplypro.inventory.model.Supplier;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test class for {@link SupplierRepository} using H2 in-memory database.
 * <p>
 * Verifies supplier search, duplicate name checks, and case-insensitive behavior
 * for both autocomplete and validation operations.
 */
@DataJpaTest
@ActiveProfiles("test")
class SupplierRepositoryTest {

    @Autowired
    private SupplierRepository supplierRepository;

    /**
     * Creates a reusable test supplier entity.
     *
     * @param name supplier name
     * @return a valid Supplier instance
     */
    private Supplier createSupplier(String name) {
        return Supplier.builder()
                .id("sup-" + name.hashCode())
                .name(name)
                .contactName("John Doe")
                .email("contact@" + name.toLowerCase() + ".com")
                .phone("+49 123 456")
                .createdBy("admin")
                .build();
    }

    /**
     * Verifies that a supplier can be found using partial case-insensitive name search.
     */
    @Test
    @DisplayName("Should find suppliers by partial name (case-insensitive)")
    void testFindByNameContainingIgnoreCase_shouldReturnMatches() {
        // Arrange
        supplierRepository.save(createSupplier("SuperCo"));
        supplierRepository.save(createSupplier("SuperMart"));
        supplierRepository.save(createSupplier("OtherCompany"));

        // Act
        List<Supplier> results = supplierRepository.findByNameContainingIgnoreCase("super");

        // Assert
        assertEquals(2, results.size(), "Expected two suppliers matching 'super'");
        assertTrue(results.stream().anyMatch(s -> s.getName().equals("SuperCo")));
        assertTrue(results.stream().anyMatch(s -> s.getName().equals("SuperMart")));
    }

    /**
     * Verifies that no results are returned if name doesn't match.
     */
    @Test
    @DisplayName("Should return empty list if no partial name match found")
    void testFindByNameContainingIgnoreCase_noMatch() {
        supplierRepository.save(createSupplier("UnrelatedName"));

        List<Supplier> results = supplierRepository.findByNameContainingIgnoreCase("missing");

        assertTrue(results.isEmpty(), "Expected no suppliers for unmatched name");
    }

    /**
     * Verifies that name uniqueness check works regardless of case.
     */
    @Test
    @DisplayName("Should detect existing supplier name ignoring case")
    void testExistsByNameIgnoreCase_trueWhenExists() {
        supplierRepository.save(createSupplier("MegaSupply"));

        boolean exists = supplierRepository.existsByNameIgnoreCase("megasupply");

        assertTrue(exists, "Expected true for existing name regardless of case");
    }

    /**
     * Verifies that false is returned if supplier name doesn't exist.
     */
    @Test
    @DisplayName("Should return false if name does not exist")
    void testExistsByNameIgnoreCase_falseWhenNotExists() {
        boolean exists = supplierRepository.existsByNameIgnoreCase("nonexistent");

        assertFalse(exists, "Expected false for non-existent supplier name");
    }

    /**
     * Verifies that exact name but different casing still triggers a match.
     */
    @Test
    @DisplayName("Should return true even for different name casing")
    void testExistsByNameIgnoreCase_caseInsensitiveMatch() {
        supplierRepository.save(createSupplier("AlphaIndustries"));

        boolean exists = supplierRepository.existsByNameIgnoreCase("alphaindustries");
        assertTrue(exists, "Expected case-insensitive name match to be true");

        exists = supplierRepository.existsByNameIgnoreCase("ALPHAINDUSTRIES");
        assertTrue(exists, "Expected uppercase match to also return true");
    }
}
