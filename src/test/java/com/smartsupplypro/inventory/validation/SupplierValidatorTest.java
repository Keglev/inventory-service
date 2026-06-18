package com.smartsupplypro.inventory.validation;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.SupplierRepository;

/**
 * Unit tests for {@link SupplierValidator}.
 *
 * <p>Covers the three public guards: {@code validateBase}, {@code assertUniqueName}
 * (case-insensitive collision detection, blank short-circuit, reflective getId fallback),
 * and {@code assertDeletable}. Repository interactions are mocked.</p>
 */
class SupplierValidatorTest {

    /**
     * Required-field validation via {@link SupplierValidator#validateBase(SupplierDTO)}.
     */
    @Nested
    class BaseValidation {
        @Test
        void should_fail_when_dto_is_null() {
            InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                    () -> SupplierValidator.validateBase(null));
            assertTrue(ex.getMessage().toLowerCase().contains("must not be null"));
        }

        @Test
        void should_fail_when_name_is_blank() {
            SupplierDTO dto = SupplierDTO.builder().name("  ").build();
            InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                    () -> SupplierValidator.validateBase(dto));
            assertTrue(ex.getMessage().toLowerCase().contains("name"));
        }

        @Test
        void should_pass_when_dto_is_valid() {
            assertDoesNotThrow(() -> SupplierValidator.validateBase(SupplierDTO.builder().name("Acme").build()));
        }
    }

    /**
     * Name uniqueness via {@link SupplierValidator#assertUniqueName(SupplierRepository, String, String)}.
     */
    @Nested
    class NameUniqueness {
        private Supplier brokenSupplier() {
            Supplier s = new Supplier() {
                @Override public String getId() { throw new RuntimeException("boom"); }
            };
            s.setName("Acme");
            return s;
        }

        @Test
        void should_fail_when_name_belongs_to_different_supplier() {
            SupplierRepository repo = mock(SupplierRepository.class);
            Supplier existing = Supplier.builder().id("other-123").name("Acme").build();
            when(repo.findByNameIgnoreCase("Acme")).thenReturn(Optional.of(existing));
            DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                    () -> SupplierValidator.assertUniqueName(repo, "Acme", "current-999"));
            assertEquals("Supplier already exists", ex.getMessage());
        }

        @Test
        void should_pass_when_updating_own_name() {
            SupplierRepository repo = mock(SupplierRepository.class);
            Supplier existing = Supplier.builder().id("same-123").name("Acme").build();
            when(repo.findByNameIgnoreCase("Acme")).thenReturn(Optional.of(existing));
            assertDoesNotThrow(() -> SupplierValidator.assertUniqueName(repo, "Acme", "same-123"));
        }

        @Test
        void should_pass_when_name_is_unique() {
            SupplierRepository repo = mock(SupplierRepository.class);
            when(repo.findByNameIgnoreCase("Unique")).thenReturn(Optional.empty());
            assertDoesNotThrow(() -> SupplierValidator.assertUniqueName(repo, "Unique", null));
        }

        @Test
        void should_short_circuit_when_name_is_blank() {
            // blank names are already rejected by validateBase; uniqueness check must be a no-op
            SupplierRepository repo = mock(SupplierRepository.class);
            assertDoesNotThrow(() -> SupplierValidator.assertUniqueName(repo, "   ", null));
            verifyNoInteractions(repo);
        }

        @Test
        void should_allow_when_getId_throws_and_excludeId_is_null() {
            SupplierRepository repo = mock(SupplierRepository.class);
            when(repo.findByNameIgnoreCase("Acme")).thenReturn(Optional.of(brokenSupplier()));
            // null falls back to null via reflective failure; Objects.equals(null, null) == true
            assertDoesNotThrow(() -> SupplierValidator.assertUniqueName(repo, "Acme", null));
        }

        @Test
        void should_reject_when_getId_throws_and_excludeId_differs() {
            SupplierRepository repo = mock(SupplierRepository.class);
            when(repo.findByNameIgnoreCase("Acme")).thenReturn(Optional.of(brokenSupplier()));
            DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                    () -> SupplierValidator.assertUniqueName(repo, "Acme", "sup-1"));
            assertEquals("Supplier already exists", ex.getMessage());
        }
    }

    /**
     * Deletion safety via {@link SupplierValidator#assertDeletable(String, java.util.function.BooleanSupplier)}.
     */
    @Nested
    class DeletionGuards {
        @Test
        void should_fail_when_id_is_blank() {
            InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                    () -> SupplierValidator.assertDeletable("  ", () -> false));
            assertTrue(ex.getMessage().toLowerCase().contains("id"));
        }

        @Test
        void should_fail_when_supplier_has_linked_items() {
            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> SupplierValidator.assertDeletable("sup-1", () -> true));
            assertEquals("Cannot delete supplier with linked items", ex.getMessage());
        }

        @Test
        void should_pass_when_no_linked_items() {
            assertDoesNotThrow(() -> SupplierValidator.assertDeletable("sup-1", () -> false));
        }

        @Test
        void should_pass_when_links_supplier_is_null() {
            assertDoesNotThrow(() -> SupplierValidator.assertDeletable("sup-1", null));
        }
    }
}
