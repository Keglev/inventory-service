package com.smartsupplypro.inventory.enums;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Tests custom methods defined in {@link StockChangeReason}.
 */
class StockChangeReasonTest {

    @Test
    @DisplayName("fromString: trims, normalizes case, and maps to enum constant")
    void should_trim_and_normalize_when_parsing_from_string() {
        assertSame(StockChangeReason.SOLD, StockChangeReason.fromString("sold"));
        assertSame(StockChangeReason.SOLD, StockChangeReason.fromString(" SOLD "));
        assertSame(StockChangeReason.RETURNED_BY_CUSTOMER,
                StockChangeReason.fromString("returned_by_customer"));
    }

    @Test
    @DisplayName("fromString: rejects null and blank with descriptive message")
    void should_reject_when_value_null_or_blank() {
        IllegalArgumentException nullEx = assertThrows(IllegalArgumentException.class,
                () -> StockChangeReason.fromString(null));
        assertTrue(nullEx.getMessage().toLowerCase().contains("cannot be null or empty"));

        IllegalArgumentException blankEx = assertThrows(IllegalArgumentException.class,
                () -> StockChangeReason.fromString("   "));
        assertTrue(blankEx.getMessage().toLowerCase().contains("cannot be null or empty"));
    }

    @Test
    @DisplayName("fromString: rejects unknown values with a cause")
    void should_reject_when_value_unknown() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> StockChangeReason.fromString("not-a-reason"));
        assertNotNull(ex.getCause());
        assertTrue(ex.getMessage().contains("Invalid stock change reason"));
    }
}
