package com.smartsupplypro.inventory.enums;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

/**
 * Unit tests for {@link StockChangeReason}.
 *
 * <p>Why this test exists:
 * <ul>
 *   <li>Enums often appear "covered" because constants are referenced by other tests, but JaCoCo
 *       still reports missed instructions if enum helper methods are not executed.</li>
 *   <li>{@link StockChangeReason} contains business-logic helpers (switch expressions, parsing,
 *       and category sets) that are part of the domain contract and should remain stable.</li>
 * </ul>
 *
 * <p>Scope:
 * <ul>
 *   <li>Validates the behavior of enum helper methods.</li>
 *   <li>Does not attempt to validate service-layer behavior that happens to use this enum.</li>
 * </ul>
 */
class StockChangeReasonTest {

    @Test
    @DisplayName("parseReason: trims, normalizes case, and maps to enum")
    void parseReason_trimsAndNormalizes() {
        assertSame(StockChangeReason.SOLD, StockChangeReason.parseReason("sold"));
        assertSame(StockChangeReason.SOLD, StockChangeReason.parseReason(" SOLD "));
        assertSame(StockChangeReason.RETURNED_BY_CUSTOMER,
                StockChangeReason.parseReason("returned_by_customer"));
    }

    @Test
    @DisplayName("parseReason: rejects null and blank")
    void parseReason_rejectsNullAndBlank() {
        IllegalArgumentException nullEx = assertThrows(IllegalArgumentException.class,
                () -> StockChangeReason.parseReason(null));
        assertTrue(nullEx.getMessage().toLowerCase().contains("cannot be null or empty"));

        IllegalArgumentException blankEx = assertThrows(IllegalArgumentException.class,
                () -> StockChangeReason.parseReason("   "));
        assertTrue(blankEx.getMessage().toLowerCase().contains("cannot be null or empty"));
    }

    @Test
    @DisplayName("parseReason: rejects unknown values with an informative exception")
    void parseReason_rejectsUnknownWithContext() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> StockChangeReason.parseReason("not-a-reason"));

        assertNotNull(ex.getCause());
        assertTrue(ex.getMessage().contains("Invalid stock change reason"));
        assertTrue(ex.getMessage().contains("Valid options"));
    }

    @Test
    @DisplayName("affectsQuantity: PRICE_CHANGE is the only non-quantity reason")
    void affectsQuantity_priceChangeIsFalseOthersTrue() {
        assertFalse(StockChangeReason.PRICE_CHANGE.affectsQuantity());

        for (StockChangeReason reason : StockChangeReason.values()) {
            if (reason != StockChangeReason.PRICE_CHANGE) {
                assertTrue(reason.affectsQuantity(), () -> reason + " should affect quantity");
            }
        }
    }

    @ParameterizedTest(name = "requiresManagerApproval: {0}")
    @EnumSource(StockChangeReason.class)
    void requiresManagerApproval_expectedClassification(StockChangeReason reason) {
        boolean expected = Set.of(
                StockChangeReason.MANUAL_UPDATE,
                StockChangeReason.DESTROYED,
                StockChangeReason.LOST
        ).contains(reason);

        assertEquals(expected, reason.requiresManagerApproval());
    }

    @ParameterizedTest(name = "requiresComplianceDocumentation: {0}")
    @EnumSource(StockChangeReason.class)
    void requiresComplianceDocumentation_expectedClassification(StockChangeReason reason) {
        boolean expected = Set.of(
                StockChangeReason.EXPIRED,
                StockChangeReason.DESTROYED,
                StockChangeReason.LOST
        ).contains(reason);

        assertEquals(expected, reason.requiresComplianceDocumentation());
    }

    @ParameterizedTest(name = "getAuditSeverity: {0}")
    @EnumSource(StockChangeReason.class)
    void getAuditSeverity_expectedMapping(StockChangeReason reason) {
        StockChangeReason.AuditSeverity severity = reason.getAuditSeverity();
        assertNotNull(severity);

        // Validate the intended mapping groups to ensure all switch arms execute.
        StockChangeReason.AuditSeverity expected = switch (reason) {
            case DESTROYED, LOST -> StockChangeReason.AuditSeverity.CRITICAL;
            case INITIAL_STOCK, SOLD -> StockChangeReason.AuditSeverity.HIGH;
            case MANUAL_UPDATE, SCRAPPED, EXPIRED -> StockChangeReason.AuditSeverity.MEDIUM;
            default -> StockChangeReason.AuditSeverity.LOW;
        };

        assertEquals(expected, severity);
    }

    @ParameterizedTest(name = "isLossReason: {0}")
    @EnumSource(StockChangeReason.class)
    void isLossReason_matchesLossReasonSet(StockChangeReason reason) {
        assertEquals(StockChangeReason.getLossReasons().contains(reason), reason.isLossReason());
    }

    @Test
    @DisplayName("Static category sets: contain the expected reasons")
    void staticCategorySets_haveExpectedMembership() {
        assertEquals(Set.of(
                StockChangeReason.SCRAPPED,
                StockChangeReason.DESTROYED,
                StockChangeReason.EXPIRED,
                StockChangeReason.LOST
        ), StockChangeReason.getLossReasons());

        assertEquals(Set.of(
                StockChangeReason.SOLD,
                StockChangeReason.RETURNED_BY_CUSTOMER
        ), StockChangeReason.getCustomerReasons());

        assertEquals(Set.of(
                StockChangeReason.RETURNED_TO_SUPPLIER
        ), StockChangeReason.getSupplierReasons());

        assertEquals(Set.of(
                StockChangeReason.LOST,
                StockChangeReason.DESTROYED
        ), StockChangeReason.getSecuritySensitiveReasons());
    }
}
