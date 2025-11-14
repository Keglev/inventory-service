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
 * <p>Scope:
 * <ul>
 *   <li>Base DTO validation (null/blank name) → {@link InvalidRequestException}</li>
 *   <li>Uniqueness guard via repository (case-insensitive) → {@link DuplicateResourceException}</li>
 *   <li>Deletion precondition via boolean supplier (repo-agnostic) → {@link IllegalStateException}</li>
 * </ul>
 *
 * <p>Notes:
 * <ul>
 *   <li>Delete guard is validated through a {@code BooleanSupplier} lambda, so tests do not depend on
 *       a specific repository signature or schema shape (1‑N vs N‑N).</li>
 *   <li>Audit fields like {@code createdBy} are server-managed and not enforced here.</li>
 * </ul>
 */
@SuppressWarnings("unused")
@ActiveProfiles("test")
class SupplierValidatorTest {

    // ---------- validateBase ----------

    @Test
    void validateBase_nullDto_throws400() {
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> SupplierValidator.validateBase(null));
        assertTrue(ex.getMessage().toLowerCase().contains("must not be null"));
    }

    @Test
    void validateBase_blankName_throws400() {
        SupplierDTO dto = SupplierDTO.builder().name("  ").build();

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> SupplierValidator.validateBase(dto));
        assertTrue(ex.getMessage().toLowerCase().contains("name"));
    }

    @Test
    void validateBase_valid_passes() {
        SupplierDTO dto = SupplierDTO.builder().name("Acme").build();
        assertDoesNotThrow(() -> SupplierValidator.validateBase(dto));
    }

    // ---------- assertUniqueName ----------

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

    @Test
    void assertUniqueName_sameRecord_update_ok() {
        SupplierRepository repo = mock(SupplierRepository.class);
        Supplier existing = Supplier.builder().id("same-123").name("Acme").build();
        when(repo.findByNameIgnoreCase("Acme")).thenReturn(Optional.of(existing));

        assertDoesNotThrow(() -> SupplierValidator.assertUniqueName(repo, "Acme", "same-123"));
    }

    @Test
    void assertUniqueName_noExisting_ok() {
        SupplierRepository repo = mock(SupplierRepository.class);
        when(repo.findByNameIgnoreCase("Unique")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> SupplierValidator.assertUniqueName(repo, "Unique", null));
    }

    // ---------- assertDeletable (repo-agnostic via BooleanSupplier) ----------

    @Test
    void assertDeletable_blankId_throws400() {
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> SupplierValidator.assertDeletable("  ", () -> false));
        assertTrue(ex.getMessage().toLowerCase().contains("id"));
    }

    @Test
    void assertDeletable_whenHasAnyLinks_true_throws409() {
        // simulate existence of at least one linked item with quantity > 0
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> SupplierValidator.assertDeletable("sup-1", () -> true));
        assertEquals("Cannot delete supplier with linked items", ex.getMessage());
    }

    @Test
    void assertDeletable_whenHasAnyLinks_false_ok() {
        assertDoesNotThrow(() -> SupplierValidator.assertDeletable("sup-1", () -> false));
    }
}
