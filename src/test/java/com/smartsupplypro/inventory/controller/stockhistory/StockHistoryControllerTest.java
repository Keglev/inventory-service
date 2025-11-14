package com.smartsupplypro.inventory.controller.stockhistory;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.StockHistoryController;
import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.StockHistoryService;

/**
 * MVC tests for StockHistoryController - HTTP contract and pagination validation.
 * 
 * Web layer testing for stock history audit trail endpoints.
 * Role-based access control tested via parameterized tests.
 */
@SuppressWarnings("unused")
@Import({TestSecurityConfig.class, GlobalExceptionHandler.class})
@WebMvcTest(StockHistoryController.class)
@ActiveProfiles("test")
class StockHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StockHistoryService stockHistoryService;

    private StockHistoryDTO history;

    /**
     * Configures stock history test data.
     */
    @BeforeEach
    @SuppressWarnings("unused")
    void setUp() {
        history = StockHistoryDTO.builder()
                .id("sh-1")
                .itemId("item-1")
                .change(5)
                .reason("SOLD")
                .createdBy("admin")
                .timestamp(LocalDateTime.of(2024, 1, 1, 10, 0))
                .build();
    }

    /**
     * Tests stock history retrieval for authenticated users.
     * Given: Historical stock movement data exists
     * When: Authorized user requests complete history
     * Then: Returns 200 with audit trail
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history -> 200 + list")
    void testGetAll_shouldReturnList(String role) throws Exception {
        when(stockHistoryService.getAll()).thenReturn(List.of(history));

        mockMvc.perform(get("/api/stock-history")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].reason").value("SOLD"));
    }

    /**
     * Tests item-specific history retrieval.
     * Given: Stock movements exist for specific item
     * When: User requests history by item ID
     * Then: Returns 200 with movement timeline
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/item/{itemId} -> 200 + list")
    void testGetByItemId_shouldReturnHistory(String role) throws Exception {
        when(stockHistoryService.getByItemId("item-1")).thenReturn(List.of(history));

        mockMvc.perform(get("/api/stock-history/item/item-1")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    /**
     * Tests history filtering by stock change reason.
     * Given: Stock changes categorized by operational reasons
     * When: User filters by specific change reason
     * Then: Returns 200 with matching movements
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/reason/{reason} -> 200 + list")
    void testGetByReason_shouldReturnHistory(String role) throws Exception {
        when(stockHistoryService.getByReason(StockChangeReason.SOLD)).thenReturn(List.of(history));

        mockMvc.perform(get("/api/stock-history/reason/SOLD")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].reason").value("SOLD"));
    }

    /**
     * Tests advanced search with multi-criteria filtering.
     * Given: Stock history with filterable attributes
     * When: User searches with specific criteria
     * Then: Returns 200 with paginated results
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (with filters) -> 200 + page")
    void testSearch_shouldReturnPagedResult(String role) throws Exception {
        Page<StockHistoryDTO> page = new PageImpl<>(List.of(history));
        when(stockHistoryService.findFiltered(any(), any(), anyString(), anyString(), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(get("/api/stock-history/search")
                        .param("itemName", "item")
                        .param("supplierId", "supplier-1")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    /**
     * Tests empty history retrieval.
     * Given: No stock movement records exist
     * When: User requests complete history
     * Then: Returns 200 with empty array
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history -> 200 + [] (empty)")
    void testGetAll_whenEmpty_shouldReturnEmptyList(String role) throws Exception {
        when(stockHistoryService.getAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/stock-history")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    /**
     * Tests search with non-matching criteria.
     * Given: Stock history exists but doesn't match filters
     * When: User searches with non-matching criteria
     * Then: Returns 200 with empty page
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (no matches) -> 200 + empty page")
    void testSearch_whenNoMatches_shouldReturnEmptyPage(String role) throws Exception {
        Page<StockHistoryDTO> emptyPage = Page.empty();
        when(stockHistoryService.findFiltered(any(), any(), anyString(), anyString(), any(Pageable.class)))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/stock-history/search")
                        .param("itemName", "nonexistent")
                        .param("supplierId", "nonexistent")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    /**
     * Tests invalid stock change reason handling.
     * Given: Invalid reason enumeration value
     * When: User filters by invalid reason
     * Then: Returns 400 Bad Request
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/reason/{reason} (invalid) -> 400")
    void testGetByReason_withInvalidEnum_shouldReturnBadRequest(String role) throws Exception {
        mockMvc.perform(get("/api/stock-history/reason/INVALID_REASON")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Tests search without filter parameters.
     * Given: Search endpoint available without mandatory filters
     * When: User searches without parameters
     * Then: Returns 200 with default paginated results
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (no params) -> 200 + page")
    void testSearch_withNoParams_shouldReturnPage(String role) throws Exception {
        Page<StockHistoryDTO> page = new PageImpl<>(List.of(history));
        when(stockHistoryService.findFiltered(any(), any(), any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/stock-history/search")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    /**
     * Tests partial search with single filter parameter.
     * Given: Search supports multiple optional filters
     * When: User provides only item name parameter
     * Then: Returns 200 with filtered results
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (itemName only) -> 200 + page")
    void testSearch_withOnlyItemName_shouldReturnPage(String role) throws Exception {
        Page<StockHistoryDTO> page = new PageImpl<>(List.of(history));
        when(stockHistoryService.findFiltered(any(), any(), any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/stock-history/search")
                        .param("itemName", "item")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    /**
     * Tests case sensitivity for reason enumeration.
     * Given: Reason enumeration requires exact case matching
     * When: User provides lowercase reason code
     * Then: Returns 400 Bad Request
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/reason/{reason} (lowercase) -> 400")
    void testGetByReason_withLowercase_shouldReturnBadRequest(String role) throws Exception {
        mockMvc.perform(get("/api/stock-history/reason/sold")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Tests date range validation for temporal integrity.
     * Given: Date range rules enforce logical chronology
     * When: User provides end date before start date
     * Then: Returns 400 without service invocation
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (invalid date range) -> 400 + service not called")
    void testSearch_withInvalidDateRange_shouldReturnBadRequest(String role) throws Exception {
        mockMvc.perform(get("/api/stock-history/search")
                        .param("startDate", "2024-01-31T00:00:00")
                        .param("endDate", "2024-01-01T00:00:00")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());

        verify(stockHistoryService, never())
                .findFiltered(any(), any(), any(), any(), any(Pageable.class));
    }

    /**
     * Tests authentication enforcement.
     * Given: Stock history endpoints require authentication
     * When: Unauthenticated user accesses endpoint
     * Then: Returns 401 Unauthorized
     */
    @Test
    @DisplayName("GET /api/stock-history (no auth) -> 401")
    void testGetAll_withoutAuthentication_shouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/stock-history"))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Tests pagination size capping for performance protection.
     * Given: System enforces maximum page size limits
     * When: User requests oversized page (1000)
     * Then: Caps page size to 200 maximum
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (oversize page) -> capped page size")
    void testSearch_withLargePageSize_shouldReturnLimitedResults(String role) throws Exception {
        Page<StockHistoryDTO> page = new PageImpl<>(List.of(history));
        when(stockHistoryService.findFiltered(any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(get("/api/stock-history/search")
                        .param("size", "1000") // above cap
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(stockHistoryService).findFiltered(any(), any(), any(), any(), pageableCaptor.capture());

        assertTrue(pageableCaptor.getValue().getPageSize() <= 200,
                "Controller should cap page size to <= 200");
    }
}
