package com.smartsupplypro.inventory.service.stockhistory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;

/**
 * Unit tests for {@link com.smartsupplypro.inventory.service.StockHistoryService}
 * read and query operations including list, ordered, and filtered pagination.
 */
@ActiveProfiles("test")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StockHistoryServiceReadTest extends StockHistoryServiceTestBase {

    /**
     * Tests for {@code getAll()}.
     */
    @Nested
    class GetAll {

        @Test
        void should_return_mapped_dto_list_for_all_history_entries() {
            LocalDateTime t1 = LocalDateTime.of(2024, 1, 1, 12, 0);
            LocalDateTime t2 = LocalDateTime.of(2024, 1, 2, 12, 0);
            var h1 = mkHistory("sh-1", ITEM_1, SUPPLIER_1, 10,  StockChangeReason.SOLD,     ADMIN,  t1, new BigDecimal("12.50"));
            var h2 = mkHistory("sh-2", ITEM_2, SUPPLIER_2, -5, StockChangeReason.SCRAPPED, "bob",  t2, null);

            when(repository.findAll()).thenReturn(List.of(h1, h2));

            List<StockHistoryDTO> out = service.getAll();

            assertEquals(2, out.size());
            assertDto(out.get(0), ITEM_1, 10, StockChangeReason.SOLD,     ADMIN,  t1, new BigDecimal("12.50"));
            assertDto(out.get(1), ITEM_2, -5, StockChangeReason.SCRAPPED, "bob",  t2, null);
        }
    }

    /**
     * Tests for {@code getByItemId(String)}.
     */
    @Nested
    class GetByItemId {

        @Test
        void should_delegate_to_ordered_finder_and_map_to_dtos() {
            LocalDateTime t = LocalDateTime.of(2024, 2, 1, 10, 30);
            var h = mkHistory("sh-3", ITEM_1, SUPPLIER_1, 1, StockChangeReason.MANUAL_UPDATE, ADMIN, t, null);
            when(repository.findByItemIdOrderByTimestampDesc(ITEM_1)).thenReturn(List.of(h));

            List<StockHistoryDTO> out = service.getByItemId(ITEM_1);

            assertEquals(1, out.size());
            assertDto(out.get(0), ITEM_1, 1, StockChangeReason.MANUAL_UPDATE, ADMIN, t, null);
        }
    }

    /**
     * Tests for {@code getByReason(StockChangeReason)}.
     */
    @Nested
    class GetByReason {

        @Test
        void should_delegate_to_ordered_finder_and_map_to_dtos() {
            LocalDateTime t = LocalDateTime.of(2024, 3, 1, 9, 0);
            var h = mkHistory("sh-4", ITEM_1, SUPPLIER_1, -2, StockChangeReason.RETURNED_BY_CUSTOMER, ADMIN, t, null);
            when(repository.findByReasonOrderByTimestampDesc(StockChangeReason.RETURNED_BY_CUSTOMER))
                    .thenReturn(List.of(h));

            List<StockHistoryDTO> out = service.getByReason(StockChangeReason.RETURNED_BY_CUSTOMER);

            assertEquals(1, out.size());
            assertDto(out.get(0), ITEM_1, -2, StockChangeReason.RETURNED_BY_CUSTOMER, ADMIN, t, null);
        }
    }

    /**
     * Tests for {@code findFiltered(LocalDateTime, LocalDateTime, String, String, Pageable)}.
     */
    @Nested
    class FindFiltered {

        @Test
        void should_map_repository_page_to_dto_page() {
            LocalDateTime start = LocalDateTime.of(2024, 1, 1, 0, 0);
            LocalDateTime end   = LocalDateTime.of(2024, 12, 31, 23, 59);
            Pageable pageable   = PageRequest.of(0, 10);

            var h = mkHistory("sh-5", ITEM_1, SUPPLIER_1, 3,
                    StockChangeReason.INITIAL_STOCK, "seed",
                    LocalDateTime.of(2024, 6, 1, 8, 0), new BigDecimal("99.99"));

            Page<com.smartsupplypro.inventory.model.StockHistory> page =
                    new PageImpl<>(List.of(h), pageable, 1);
            when(repository.findFiltered(start, end, "Widget", "S1", pageable)).thenReturn(page);

            Page<StockHistoryDTO> out = service.findFiltered(start, end, "Widget", "S1", pageable);

            assertEquals(1, out.getTotalElements());
            StockHistoryDTO dto = out.getContent().get(0);
            assertEquals(ITEM_1, dto.itemId());
            assertEquals(3, dto.change());
            assertEquals(StockChangeReason.INITIAL_STOCK.name(), dto.reason());
            assertEquals("seed", dto.createdBy());
            assertEquals(new BigDecimal("99.99"), dto.priceAtChange());
        }
    }
}
