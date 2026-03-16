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
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.StockHistoryService;

/**
 * # StockHistoryControllerSearchTest
 *
 * MVC tests for the {@code GET /api/stock-history/search} endpoint in {@link StockHistoryController}.
 *
 * <p><strong>Purpose</strong></p>
 * Validate filtering and pagination behavior for the stock history audit trail search.
 * This endpoint backs the UI search experience and is a key driver for operational investigation.
 *
 * <p><strong>Operations Tested</strong></p>
 * <ul>
 *   <li>Optional filter combinations (none, partial, multiple)</li>
 *   <li>Date-range validation guard (endDate before startDate -> 400)</li>
 *   <li>Page size capping (performance protection)</li>
 *   <li>Branch coverage for short-circuit date checks and page-size cap logic</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong></p>
 * <ul>
 *   <li>Service layer is mocked; tests assert controller-side validation and parameter mapping.</li>
 *   <li>Assertions focus on stable response structure rather than exact pageable internals.</li>
 * </ul>
 */
@SuppressWarnings("unused")
@Import({TestSecurityConfig.class, GlobalExceptionHandler.class})
@WebMvcTest(StockHistoryController.class)
@ActiveProfiles("test")
class StockHistoryControllerSearchTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StockHistoryService stockHistoryService;

    private StockHistoryDTO history;

    @BeforeEach
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

    private void stubSearchReturns(Page<StockHistoryDTO> page) {
                when(stockHistoryService.findFiltered(any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(page);
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (with filters) -> 200 + page")
    void search_withFilters_returnsPagedResult(String role) throws Exception {
        // GIVEN
        stubSearchReturns(new PageImpl<>(List.of(history)));

        // WHEN/THEN
        mockMvc.perform(get("/api/stock-history/search")
                        .param("itemName", "item")
                        .param("supplierId", "supplier-1")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (no matches) -> 200 + empty page")
    void search_whenNoMatches_returnsEmptyPage(String role) throws Exception {
        // GIVEN
        stubSearchReturns(Page.empty());

        // WHEN/THEN
        mockMvc.perform(get("/api/stock-history/search")
                        .param("itemName", "nonexistent")
                        .param("supplierId", "nonexistent")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (no params) -> 200 + page")
    void search_withNoParams_returnsPage(String role) throws Exception {
        // GIVEN
        stubSearchReturns(new PageImpl<>(List.of(history)));

        // WHEN/THEN
        mockMvc.perform(get("/api/stock-history/search")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (itemName only) -> 200 + page")
    void search_withOnlyItemName_returnsPage(String role) throws Exception {
        // GIVEN
        stubSearchReturns(new PageImpl<>(List.of(history)));

        // WHEN/THEN
        mockMvc.perform(get("/api/stock-history/search")
                        .param("itemName", "item")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (invalid date range) -> 400 + service not called")
    void search_withInvalidDateRange_returnsBadRequest(String role) throws Exception {
        // GIVEN/WHEN
        mockMvc.perform(get("/api/stock-history/search")
                        .param("startDate", "2024-01-31T00:00:00")
                        .param("endDate", "2024-01-01T00:00:00")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());

        // THEN
        verify(stockHistoryService, never())
                .findFiltered(any(), any(), any(), any(), any(Pageable.class));
    }

    /**
     * Branch coverage: exercises the short-circuit path where {@code endDate} is not provided.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (startDate only) -> 200 + page")
    void search_withOnlyStartDate_returnsPage(String role) throws Exception {
        // GIVEN
        stubSearchReturns(new PageImpl<>(List.of(history)));

        // WHEN/THEN
        mockMvc.perform(get("/api/stock-history/search")
                        .param("startDate", "2024-01-01T00:00:00")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    /**
     * Branch coverage: exercises the short-circuit path where {@code startDate} is not provided.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (endDate only) -> 200 + page")
    void search_withOnlyEndDate_returnsPage(String role) throws Exception {
        // GIVEN
        stubSearchReturns(new PageImpl<>(List.of(history)));

        // WHEN/THEN
        mockMvc.perform(get("/api/stock-history/search")
                        .param("endDate", "2024-01-31T00:00:00")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (valid date range) -> 200 + page")
    void search_withValidDateRange_returnsPage(String role) throws Exception {
        // GIVEN
        stubSearchReturns(new PageImpl<>(List.of(history)));

        // WHEN/THEN
        mockMvc.perform(get("/api/stock-history/search")
                        .param("startDate", "2024-01-01T00:00:00")
                        .param("endDate", "2024-01-31T00:00:00")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (oversize page) -> capped page size")
    void search_withLargePageSize_capsPageSize(String role) throws Exception {
        // GIVEN
        stubSearchReturns(new PageImpl<>(List.of(history)));

        // WHEN
        mockMvc.perform(get("/api/stock-history/search")
                        .param("size", "1000")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk());

        // THEN
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(stockHistoryService).findFiltered(any(), any(), any(), any(), pageableCaptor.capture());

        assertTrue(pageableCaptor.getValue().getPageSize() <= 200,
                "Controller should cap page size to <= 200");
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (page size within cap) -> not capped")
    void search_withPageSizeWithinCap_doesNotCap(String role) throws Exception {
        // GIVEN
        stubSearchReturns(new PageImpl<>(List.of(history)));

        // WHEN
        mockMvc.perform(get("/api/stock-history/search")
                        .param("size", "10")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk());

        // THEN
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(stockHistoryService).findFiltered(any(), any(), any(), any(), pageableCaptor.capture());

        assertTrue(pageableCaptor.getValue().getPageSize() == 10,
                "Controller should keep requested page size when <= 200");
    }

    @Test
    @DisplayName("GET /api/stock-history/search (no auth) -> 401")
    void search_withoutAuthentication_returnsUnauthorized() throws Exception {
        // GIVEN/WHEN/THEN
        mockMvc.perform(get("/api/stock-history/search"))
                .andExpect(status().isUnauthorized());
    }
}
