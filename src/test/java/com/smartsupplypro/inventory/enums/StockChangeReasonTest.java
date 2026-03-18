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
 * # StockChangeReasonTest
 *
 * Unit tests for {@link StockChangeReason}.
 *
 * <p><strong>Purpose</strong></p>
 * {@link StockChangeReason} is a domain enum with executable logic (parsing helpers, classification
 * helpers, and category sets). In practice, the enum constants are referenced all over the codebase,
 * but JaCoCo will still report missed instructions if the helper methods are never executed.
 * This suite keeps the enum's behavior explicit, stable, and independently verifiable.
 *
 * <p><strong>Operations Tested</strong></p>
 * <ul>
 *   <li>{@link StockChangeReason#parseReason(String)}: normalization + fail-fast error messaging</li>
 *   <li>Classification helpers: manager-approval, compliance documentation, audit severity</li>
 *   <li>Category sets: customer/supplier/loss/security-sensitive reason groupings</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong></p>
 * <ul>
 *   <li>Assert on exception messages only where they are part of the contract (public API).</li>
 *   <li>Prefer intent-focused assertions (membership and mapping) over brittle ordering checks.</li>
 * </ul>
 */
class StockChangeReasonTest {

    @Test
    @DisplayName("parseReason: trims, normalizes case, and maps to enum")
    void parseReason_trimsAndNormalizes() {
        // GIVEN/WHEN/THEN: parsing should be tolerant of whitespace and case.
        assertSame(StockChangeReason.SOLD, StockChangeReason.parseReason("sold"));
        assertSame(StockChangeReason.SOLD, StockChangeReason.parseReason(" SOLD "));
        assertSame(StockChangeReason.RETURNED_BY_CUSTOMER,
                StockChangeReason.parseReason("returned_by_customer"));
    }

    @Test
    @DisplayName("parseReason: rejects null and blank")
    void parseReason_rejectsNullAndBlank() {
        // GIVEN/WHEN: null input
        IllegalArgumentException nullEx = assertThrows(IllegalArgumentException.class,
                () -> StockChangeReason.parseReason(null));
        assertTrue(nullEx.getMessage().toLowerCase().contains("cannot be null or empty"));

        // GIVEN/WHEN: blank input
        IllegalArgumentException blankEx = assertThrows(IllegalArgumentException.class,
                () -> StockChangeReason.parseReason("   "));
        assertTrue(blankEx.getMessage().toLowerCase().contains("cannot be null or empty"));
    }

    @Test
    @DisplayName("parseReason: rejects unknown values with an informative exception")
    void parseReason_rejectsUnknownWithContext() {
        // WHEN
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> StockChangeReason.parseReason("not-a-reason"));

        // THEN: keep a human-readable error and preserve the underlying cause.
        assertNotNull(ex.getCause());
        assertTrue(ex.getMessage().contains("Invalid stock change reason"));
        assertTrue(ex.getMessage().contains("Valid options"));
    }

    @Test
    @DisplayName("affectsQuantity: PRICE_CHANGE is the only non-quantity reason")
    void affectsQuantity_priceChangeIsFalseOthersTrue() {
        // GIVEN: PRICE_CHANGE is a financial update only (quantity unchanged).
        assertFalse(StockChangeReason.PRICE_CHANGE.affectsQuantity());

        // THEN: all remaining reasons are treated as quantity-affecting.
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
        // WHEN
        StockChangeReason.AuditSeverity severity = reason.getAuditSeverity();
        assertNotNull(severity);

        // THEN: validate the intended mapping groups (covers all switch arms).
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
        // These sets are part of the domain contract (used by analytics/audit/security decisions).
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
