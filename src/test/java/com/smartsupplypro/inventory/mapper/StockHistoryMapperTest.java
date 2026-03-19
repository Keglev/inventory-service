package com.smartsupplypro.inventory.mapper;

import java.lang.reflect.Constructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;

/**
 * Unit tests for {@link StockHistoryMapper}.
 *
 * <p><strong>Purpose</strong>: Validate enterprise-grade audit mapping between the immutable
 * {@link StockHistory} entity and its external {@link StockHistoryDTO} representation.</p>
 *
 * <p><strong>Operations Tested</strong>:</p>
 * <ul>
 *   <li>Null-safety boundaries (null in → null out)</li>
 *   <li>Enum ↔ String transformations for reason codes</li>
 *   <li>Strict parsing error behavior for invalid reason strings</li>
 *   <li>Utility-class constructor guard (no instances)</li>
 * </ul>
 */
class StockHistoryMapperTest {

    @Test
    @DisplayName("toDTO: null input returns null")
    void toDTO_nullInput_returnsNull() {
        // GIVEN
        StockHistory entity = null;

        // WHEN
        StockHistoryDTO dto = StockHistoryMapper.toDTO(entity);

        // THEN
        assertNull(dto);
    }

    @Test
    @DisplayName("toDTO: maps audit fields and converts enum reason to string")
    void toDTO_mapsFields_andTransformsEnumReason() {
        // GIVEN
        LocalDateTime ts = LocalDateTime.of(2025, 1, 2, 3, 4, 5);
        StockHistory entity = StockHistory.builder()
                .id("sh-1")
                .itemId("item-1")
                .change(5)
                .reason(StockChangeReason.INITIAL_STOCK)
                .createdBy("admin")
                .timestamp(ts)
                .priceAtChange(new BigDecimal("12.34"))
                .build();

        // WHEN
        StockHistoryDTO dto = StockHistoryMapper.toDTO(entity);

        // THEN
        assertNotNull(dto);
        assertEquals("sh-1", dto.getId());
        assertEquals("item-1", dto.getItemId());
        assertEquals(5, dto.getChange());
        assertEquals("INITIAL_STOCK", dto.getReason());
        assertEquals("admin", dto.getCreatedBy());
        assertEquals(ts, dto.getTimestamp());
        assertEquals(new BigDecimal("12.34"), dto.getPriceAtChange());
    }

    @Test
    @DisplayName("toDTO: entity with null reason yields DTO with null reason")
    void toDTO_nullReason_yieldsNullReasonString() {
        // GIVEN
        StockHistory entity = StockHistory.builder()
                .id("sh-2")
                .itemId("item-2")
                .change(-1)
                .reason(null)
                .createdBy("user")
                .timestamp(LocalDateTime.of(2025, 2, 3, 4, 5, 6))
                .priceAtChange(null)
                .build();

        // WHEN
        StockHistoryDTO dto = StockHistoryMapper.toDTO(entity);

        // THEN
        assertNotNull(dto);
        assertNull(dto.getReason());
    }

    @Test
    @DisplayName("toEntity: null input returns null")
    void toEntity_nullInput_returnsNull() {
        // GIVEN
        StockHistoryDTO dto = null;

        // WHEN
        StockHistory entity = StockHistoryMapper.toEntity(dto);

        // THEN
        assertNull(entity);
    }

    @Test
    @DisplayName("toEntity: maps audit fields and parses reason string to enum")
    void toEntity_mapsFields_andParsesEnumReason() {
        // GIVEN
        LocalDateTime ts = LocalDateTime.of(2026, 3, 4, 5, 6, 7);
        StockHistoryDTO dto = StockHistoryDTO.builder()
                .id("sh-3")
                .itemId("item-3")
                .change(10)
                .reason("PRICE_CHANGE")
                .createdBy("system")
                .timestamp(ts)
                .priceAtChange(new BigDecimal("99.99"))
                .build();

        // WHEN
        StockHistory entity = StockHistoryMapper.toEntity(dto);

        // THEN
        assertNotNull(entity);
        assertEquals("sh-3", entity.getId());
        assertEquals("item-3", entity.getItemId());
        assertEquals(10, entity.getChange());
        assertSame(StockChangeReason.PRICE_CHANGE, entity.getReason());
        assertEquals("system", entity.getCreatedBy());
        assertEquals(ts, entity.getTimestamp());
        assertEquals(new BigDecimal("99.99"), entity.getPriceAtChange());
    }

    @Test
    @DisplayName("toEntity: null reason string yields entity with null reason")
    void toEntity_nullReasonString_yieldsNullEnum() {
        // GIVEN
        StockHistoryDTO dto = StockHistoryDTO.builder()
                .id("sh-4")
                .itemId("item-4")
                .change(1)
                .reason(null)
                .createdBy("admin")
                .timestamp(LocalDateTime.of(2026, 1, 1, 0, 0, 0))
                .build();

        // WHEN
        StockHistory entity = StockHistoryMapper.toEntity(dto);

        // THEN
        assertNotNull(entity);
        assertNull(entity.getReason());
    }

    @Test
    @DisplayName("toEntity: invalid reason string throws IllegalArgumentException with valid values")
    void toEntity_invalidReasonString_throwsWithContext() {
        // GIVEN
        StockHistoryDTO dto = StockHistoryDTO.builder()
                .id("sh-5")
                .itemId("item-5")
                .change(1)
                .reason("NOT_A_REAL_REASON")
                .createdBy("admin")
                .timestamp(LocalDateTime.of(2026, 1, 1, 0, 0, 0))
                .build();

        // WHEN
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> StockHistoryMapper.toEntity(dto));

        // THEN
        // The exception message is treated as part of the mapper's audit/debug contract:
        // it must clearly identify the invalid value and enumerate allowed reasons.
        assertTrue(ex.getMessage().contains("Invalid stock change reason: NOT_A_REAL_REASON"));
        assertTrue(ex.getMessage().contains("Valid values:"));
        assertNotNull(ex.getCause());
        assertTrue(ex.getCause() instanceof IllegalArgumentException);
    }

    @Test
    @DisplayName("constructor: utility class cannot be instantiated")
    void constructor_throwsUnsupportedOperationException() throws Exception {
        // GIVEN
        Constructor<StockHistoryMapper> ctor = StockHistoryMapper.class.getDeclaredConstructor();
        ctor.setAccessible(true);

        // WHEN
        var ex = assertThrows(java.lang.reflect.InvocationTargetException.class, ctor::newInstance);

        // THEN
        assertTrue(ex.getCause() instanceof UnsupportedOperationException);
        assertEquals("Utility class - no instances allowed", ex.getCause().getMessage());
    }
}
