package com.smartsupplypro.inventory.validation;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.SupplierRepository;

/**
 * Unit tests for {@link SupplierValidator}.
 *
 * <p><strong>Validation Layers Tested:</strong></p>
 * <ul>
 *   <li><b>Base validation:</b> Null/blank checks on DTO fields → {@link InvalidRequestException}</li>
 *   <li><b>Uniqueness:</b> Case-insensitive name collision detection → {@link DuplicateResourceException}</li>
 *   <li><b>Deletion precondition:</b> Prevents deletion of suppliers with linked items → {@link IllegalStateException}</li>
 * </ul>
 *
 * <p><strong>Design Notes:</strong></p>
 * <ul>
 *   <li>Delete validation uses a {@code BooleanSupplier} lambda, making it repo-agnostic
 *       and independent of specific relationship cardinality (1‑N vs N‑N).</li>
 *   <li>Audit fields like {@code createdBy} are server-managed and not validated here.</li>
 *   <li>Tests use mocks to isolate validator logic from repository implementation.</li>
 * </ul>
 *
 * @see SupplierValidator
 */
@SuppressWarnings("unused")
@ActiveProfiles("test")
class SupplierValidatorTest {

    // ==================== validateBase() Tests ====================
    // Tests basic DTO validation (null/blank checks)

    /**
     * Validates that null DTO is rejected.
     * Expected: {@link InvalidRequestException} with "must not be null" message.
     */
    @Test
    void validateBase_nullDto_throws400() {
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> SupplierValidator.validateBase(null));
        assertTrue(ex.getMessage().toLowerCase().contains("must not be null"));
    }

    /**
     * Validates that blank supplier name is rejected.
     * Expected: {@link InvalidRequestException} mentioning "name" field.
     */
    @Test
    void validateBase_blankName_throws400() {
        SupplierDTO dto = SupplierDTO.builder().name("  ").build();

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> SupplierValidator.validateBase(dto));
        assertTrue(ex.getMessage().toLowerCase().contains("name"));
    }

    /**
     * Validates that valid DTO passes base validation.
     * Expected: No exception thrown.
     */
    @Test
    void validateBase_valid_passes() {
        SupplierDTO dto = SupplierDTO.builder().name("Acme").build();
        assertDoesNotThrow(() -> SupplierValidator.validateBase(dto));
    }

    // ==================== assertUniqueName() Tests ====================
    // Tests case-insensitive name uniqueness enforcement

    /**
     * Validates that duplicate names from OTHER suppliers are rejected.
     * Scenario: Attempting to create/update a supplier with a name already owned by a different supplier.
     * Expected: {@link DuplicateResourceException} with "already exists" message.
     */
    @Test
    void assertUniqueName_duplicateOtherId_throws409() {
        SupplierRepository repo = mock(SupplierRepository.class);
        // existing supplier with different id owns the same name (case-insensitive)
        Supplier existing = Supplier.builder().id("other-123").name("Acme").build();
        when(repo.findByNameIgnoreCase("Acme")).thenReturn(Optional.of(existing));

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> SupplierValidator.assertUniqueName(repo, "Acme", "current-999"));
        assertEquals("Supplier already exists", ex.getMessage());
    }

    /**
     * Validates that updating a supplier with its SAME name is allowed.
     * Scenario: Supplier "Acme" (id: same-123) updates its own record without changing the name.
     * Expected: No exception (idempotent update is safe).
     */
    @Test
    void assertUniqueName_sameRecord_update_ok() {
        SupplierRepository repo = mock(SupplierRepository.class);
        Supplier existing = Supplier.builder().id("same-123").name("Acme").build();
        when(repo.findByNameIgnoreCase("Acme")).thenReturn(Optional.of(existing));

        // Same ID = same supplier = update is allowed
        assertDoesNotThrow(() -> SupplierValidator.assertUniqueName(repo, "Acme", "same-123"));
    }

    /**
     * Validates that a completely new (unique) name is allowed.
     * Scenario: No existing supplier has this name.
     * Expected: No exception thrown.
     */
    @Test
    void assertUniqueName_noExisting_ok() {
        SupplierRepository repo = mock(SupplierRepository.class);
        when(repo.findByNameIgnoreCase("Unique")).thenReturn(Optional.empty());

        // No existing record with this name = safe to proceed
        assertDoesNotThrow(() -> SupplierValidator.assertUniqueName(repo, "Unique", null));
    }

    // ==================== assertDeletable() Tests ====================
    // Tests deletion preconditions using repo-agnostic BooleanSupplier pattern

    /**
     * Validates that blank supplier IDs are rejected before deletion.
     * Expected: {@link InvalidRequestException} mentioning "id" field.
     */
    @Test
    void assertDeletable_blankId_throws400() {
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> SupplierValidator.assertDeletable("  ", () -> false));
        assertTrue(ex.getMessage().toLowerCase().contains("id"));
    }

    /**
     * Validates that suppliers with linked inventory items cannot be deleted.
     * Scenario: The BooleanSupplier returns true, indicating at least one item is linked.
     * Expected: {@link IllegalStateException} preventing deletion.
     */
    @Test
    void assertDeletable_whenHasAnyLinks_true_throws409() {
        // simulate existence of at least one linked item with quantity > 0
        // BooleanSupplier.getAsBoolean() returns true = has links = cannot delete
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> SupplierValidator.assertDeletable("sup-1", () -> true));
        assertEquals("Cannot delete supplier with linked items", ex.getMessage());
    }

    /**
     * Validates that suppliers with NO linked items CAN be deleted.
     * Scenario: The BooleanSupplier returns false, indicating no items are linked.
     * Expected: No exception (deletion is allowed).
     */
    @Test
    void assertDeletable_whenHasAnyLinks_false_ok() {
        // BooleanSupplier.getAsBoolean() returns false = no links = safe to delete
        assertDoesNotThrow(() -> SupplierValidator.assertDeletable("sup-1", () -> false));
    }
}
