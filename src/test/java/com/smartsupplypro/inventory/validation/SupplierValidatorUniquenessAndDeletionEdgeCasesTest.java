package com.smartsupplypro.inventory.validation;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.SupplierRepository;

/**
 * # SupplierValidatorUniquenessAndDeletionEdgeCasesTest
 *
 * Incremental unit tests for {@link SupplierValidator}.
 *
 * <p><strong>Purpose</strong></p>
 * The primary validator suite covers the common "happy" and "expected failure" cases.
 * This class targets edge-case branches that are easy to miss but are still part of the
 * validator's public contract.
 *
 * <p><strong>Operations Tested</strong></p>
 * <ul>
 *   <li>{@link SupplierValidator#assertUniqueName(SupplierRepository, String, String)} short-circuit
 *       behavior for blank names</li>
 *   <li>Reflective ID extraction fallback path used by {@code assertUniqueName}</li>
 *   <li>{@link SupplierValidator#assertDeletable(String, java.util.function.BooleanSupplier)}
 *       behavior when the link-check supplier is null</li>
 * </ul>
 */
class SupplierValidatorUniquenessAndDeletionEdgeCasesTest {

    @Test
    @DisplayName("assertUniqueName: blank names short-circuit (repo not consulted)")
    void assertUniqueName_blankName_shortCircuits() {
        // GIVEN
        SupplierRepository repo = mock(SupplierRepository.class);

        // WHEN/THEN: validateBase owns the blank-name guard; uniqueness check must be a no-op.
        assertDoesNotThrow(() -> SupplierValidator.assertUniqueName(repo, "   ", null));
        verifyNoInteractions(repo);
    }

    @Test
    @DisplayName("assertUniqueName: reflective getId invocation failure exercises fallback")
    void assertUniqueName_reflectionFailure_fallsBackToNullId() {
        // GIVEN: entity whose getId() throws at invocation time (InvocationTargetException)
        SupplierRepository repo = mock(SupplierRepository.class);

        Supplier brokenSupplier = new Supplier() {
            @Override
            public String getId() {
                throw new RuntimeException("boom");
            }
        };
        brokenSupplier.setName("Acme");

        when(repo.findByNameIgnoreCase("Acme")).thenReturn(Optional.of(brokenSupplier));

        // Case 1: excludeId is also null -> Objects.equals(null, null) == true -> allowed
        assertDoesNotThrow(() -> SupplierValidator.assertUniqueName(repo, "Acme", null));

        // Case 2: excludeId is non-null -> treated as a different supplier -> conflict
        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> SupplierValidator.assertUniqueName(repo, "Acme", "sup-1"));
        assertEquals("Supplier already exists", ex.getMessage());
    }

    @Test
    @DisplayName("assertDeletable: null BooleanSupplier is treated as no links")
    void assertDeletable_nullHasAnyLinksSupplier_allowsDeletion() {
        assertDoesNotThrow(() -> SupplierValidator.assertDeletable("sup-1", null));
    }
}
