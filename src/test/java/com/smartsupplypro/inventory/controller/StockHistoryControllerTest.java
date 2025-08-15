package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.StockHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Web MVC tests for {@link StockHistoryController}.
 *
 * <p>Scope:
 * <ul>
 *   <li>Endpoint wiring and role-based access</li>
 *   <li>Validation (date-window) and defensive pagination (size cap)</li>
 *   <li>Response shape for list and paged endpoints</li>
 * </ul>
 */
@Import({TestSecurityConfig.class, GlobalExceptionHandler.class})
@WebMvcTest(StockHistoryController.class)
@ActiveProfiles("test")
class StockHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StockHistoryService stockHistoryService;

    private StockHistoryDTO history;

    /** Reusable sample DTO. */
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

    /** GET /api/stock-history returns a list for USER/ADMIN. */
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

    /** GET /api/stock-history/item/{itemId} returns the item’s history. */
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

    /** GET /api/stock-history/reason/{reason} returns history by reason. */
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

    /** GET /api/stock-history/search with filters returns a page. */
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

    /** GET /api/stock-history returns empty list when there are no records. */
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

    /** GET /api/stock-history/search returns empty page when filters match nothing. */
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

    /** GET /api/stock-history/reason/{reason} -> 400 when the enum is invalid. */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/reason/{reason} (invalid) -> 400")
    void testGetByReason_withInvalidEnum_shouldReturnBadRequest(String role) throws Exception {
        mockMvc.perform(get("/api/stock-history/reason/INVALID_REASON")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
    }

    /** GET /api/stock-history/search with no params still returns a page. */
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

    /** GET /api/stock-history/search with only itemName returns a page. */
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

    /** GET /api/stock-history/reason/{reason} -> 400 for lowercase (strict enum binding). */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/reason/{reason} (lowercase) -> 400")
    void testGetByReason_withLowercase_shouldReturnBadRequest(String role) throws Exception {
        mockMvc.perform(get("/api/stock-history/reason/sold")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
    }

    /** GET /api/stock-history/search -> 400 when endDate < startDate (guard + no service call). */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (invalid date range) -> 400 + service not called")
    void testSearch_withInvalidDateRange_shouldReturnBadRequest(String role) throws Exception {
        mockMvc.perform(get("/api/stock-history/search")
                        .param("startDate", "2024-01-31T00:00:00")
                        .param("endDate", "2024-01-01T00:00:00")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());

        // Verify the controller short-circuited (service not invoked)
        verify(stockHistoryService, never())
                .findFiltered(any(), any(), any(), any(), any(Pageable.class));
    }

    /** GET /api/stock-history without auth -> 401. */
    @Test
    @DisplayName("GET /api/stock-history (no auth) -> 401")
    void testGetAll_withoutAuthentication_shouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/stock-history"))
                .andExpect(status().isUnauthorized());
    }

    /** GET /api/stock-history/search (size=1000) -> 200 and page size capped (<= 200). */
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
