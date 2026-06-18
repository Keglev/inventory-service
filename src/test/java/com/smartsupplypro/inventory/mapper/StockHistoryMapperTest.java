package com.smartsupplypro.inventory.mapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;

/**
 * Unit tests for {@link StockHistoryMapper} bidirectional mapping correctness.
 */
class StockHistoryMapperTest {

    private final StockHistoryMapper mapper = new StockHistoryMapper();

    /**
     * Mapping from {@link StockHistory} entity to {@link StockHistoryDTO}.
     */
    @Nested
    class ToDTO {

        @Test
        void should_return_null_for_null_input() {
            assertNull(mapper.toDTO(null));
        }

        @Test
        void should_convert_enum_reason_to_its_string_name() {
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

    /**
     * Mapping from {@link StockHistoryDTO} to {@link StockHistory} entity.
     */
    @Nested
    class ToEntity {

        @Test
        void should_return_null_for_null_input() {
            assertNull(mapper.toEntity(null));
        }

        @Test
        void should_parse_valid_reason_string_to_enum() {
            StockHistoryDTO dto = StockHistoryDTO.builder()
                    .id("h-3").itemId("i-3").change(10).reason("PRICE_CHANGE")
                    .createdBy("sys").timestamp(LocalDateTime.of(2026, 1, 1, 0, 0)).build();
            StockHistory entity = mapper.toEntity(dto);
            assertSame(StockChangeReason.PRICE_CHANGE, entity.getReason());
        }

        @Test
        void should_return_null_reason_when_reason_string_is_null() {
            StockHistoryDTO dto = StockHistoryDTO.builder()
                    .id("h-4").itemId("i-4").change(1).reason(null)
                    .createdBy("admin").timestamp(LocalDateTime.of(2026, 1, 1, 0, 0)).build();
            StockHistory entity = mapper.toEntity(dto);
            assertNull(entity.getReason());
        }

        @Test
        void should_throw_for_invalid_reason_string_with_context_message() {
            StockHistoryDTO dto = StockHistoryDTO.builder()
                    .id("h-5").itemId("i-5").change(1).reason("INVALID")
                    .createdBy("admin").timestamp(LocalDateTime.of(2026, 1, 1, 0, 0)).build();
            IllegalArgumentException ex = assertThrows(
                    IllegalArgumentException.class, () -> mapper.toEntity(dto));
            assertTrue(ex.getMessage().contains("Invalid stock change reason: INVALID"));
            assertTrue(ex.getMessage().contains("Valid values:"));
        }
    }
}
