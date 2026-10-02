package com.smartsupplypro.inventory.mapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;

/**
 * Unit tests for {@link StockHistoryMapper} entity-to-DTO mapping.
 */
class StockHistoryMapperTest {

    private final StockHistoryMapper mapper = new StockHistoryMapper();

    /**
     * Mapping from {@link StockHistory} entity to {@link StockHistoryDTO}.
     */
    @Nested
    class ToDTO {

        @Test
        void should_return_null_when_the_entity_is_null() {
            assertNull(mapper.toDTO(null));
        }

        @Test
        void should_convert_the_reason_to_its_string_name_when_mapping_to_a_dto() {
            StockHistory entity = StockHistory.builder()
                    .id("h-1").itemId("i-1").change(5)
                    .reason(StockChangeReason.INITIAL_STOCK).createdBy("admin")
                    .timestamp(LocalDateTime.of(2025, 1, 1, 0, 0))
                    .priceAtChange(new BigDecimal("12.34")).build();
            StockHistoryDTO dto = mapper.toDTO(entity);
            assertEquals("INITIAL_STOCK", dto.reason());
        }

        @Test
        void should_return_null_reason_string_when_reason_is_null() {
            StockHistory entity = StockHistory.builder()
                    .id("h-2").itemId("i-2").change(-1).reason(null)
                    .createdBy("user").timestamp(LocalDateTime.of(2025, 2, 1, 0, 0)).build();
            StockHistoryDTO dto = mapper.toDTO(entity);
            assertNull(dto.reason());
        }
    }
}
