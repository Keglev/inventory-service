package com.smartsupplypro.inventory.validation;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;

import org.springframework.test.context.ActiveProfiles;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@ActiveProfiles("test")
public class StockHistoryValidationTest {
     private StockHistoryDTO validDTO() {
        return StockHistoryDTO.builder()
                .id("sh-1")
                .itemId("item-1")
                .change(5)
                .reason("SOLD")
                .createdBy("admin")
                .build();
    }

    @Test
    void testValidDTO_shouldPass() {
        assertDoesNotThrow(() -> StockHistoryValidator.validate(validDTO()));
    }

    @Test
    void testEmptyItemId_shouldThrow() {
        StockHistoryDTO dto = validDTO();
        dto.setItemId(null);
        Exception e = assertThrows(IllegalArgumentException.class, () -> StockHistoryValidator.validate(dto));
        assertEquals("Item ID cannot be null or empty", e.getMessage());
    }

    @Test
    void testZeroChange_shouldThrow() {
        StockHistoryDTO dto = validDTO();
        dto.setChange(0);
        Exception e = assertThrows(IllegalArgumentException.class, () -> StockHistoryValidator.validate(dto));
        assertEquals("Change amount must be non-zero", e.getMessage());
    }

    @Test
    void testInvalidReason_shouldThrow() {
        StockHistoryDTO dto = validDTO();
        dto.setReason("DONATED");
        Exception e = assertThrows(IllegalArgumentException.class, () -> StockHistoryValidator.validate(dto));
        assertEquals("Unsupported change reason: DONATED", e.getMessage());
    }

    @Test
    void testNullCreatedBy_shouldThrow() {
        StockHistoryDTO dto = validDTO();
        dto.setCreatedBy(null);
        Exception e = assertThrows(IllegalArgumentException.class, () -> StockHistoryValidator.validate(dto));
        assertEquals("CreatedBy is required", e.getMessage());
    }

    @Test
    void testBlankCreatedBy_shouldThrow() {
        StockHistoryDTO dto = validDTO();
        dto.setCreatedBy(" ");
        Exception e = assertThrows(IllegalArgumentException.class, () -> StockHistoryValidator.validate(dto));
        assertEquals("CreatedBy is required", e.getMessage());
    }
    @Test
    void testValidReason_shouldNotThrow() {
        for (StockChangeReason reason : StockChangeReason.values()) {
            StockHistoryDTO dto = validDTO();
            dto.setReason(reason.name());
            assertDoesNotThrow(() -> StockHistoryValidator.validate(dto));
        }
    }

    @Test
    void testLowercaseReason_shouldThrow() {
        StockHistoryDTO dto = validDTO();
        dto.setReason("sold"); // not uppercase
        Exception e = assertThrows(IllegalArgumentException.class, () ->
            StockHistoryValidator.validate(dto));
        assertEquals("Unsupported change reason: sold", e.getMessage());
    }

}
