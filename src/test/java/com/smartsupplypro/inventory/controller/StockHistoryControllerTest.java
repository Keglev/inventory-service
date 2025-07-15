package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.StockHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for {@link StockHistoryController}.
 * These tests verify correct behavior of all public endpoints, including security role handling,
 * parameter validation, and response content.
 */
@Import({TestSecurityConfig.class, GlobalExceptionHandler.class})
@WebMvcTest(StockHistoryController.class)
@ActiveProfiles("test")
public class StockHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StockHistoryService stockHistoryService;

    private StockHistoryDTO history;

    /**
     * Initializes a reusable {@link StockHistoryDTO} before each test execution.
     */
    @BeforeEach
    void setUp() {
        history = StockHistoryDTO.builder()
                .id("sh-1")
                .itemId("item-1")
                .change(5)
                .reason("SOLD")
                .createdBy("admin")
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Verifies that the GET /api/stock-history endpoint returns a list of stock history records.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testGetAll_shouldReturnList(String role) throws Exception {
        when(stockHistoryService.getAll()).thenReturn(List.of(history));

        mockMvc.perform(get("/api/stock-history")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].reason").value("SOLD"));
    }

    /**
     * Verifies that GET /api/stock-history/item/{itemId} returns the stock history for a specific item.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testGetByItemId_shouldReturnHistory(String role) throws Exception {
        when(stockHistoryService.getByItemId("item-1")).thenReturn(List.of(history));

        mockMvc.perform(get("/api/stock-history/item/item-1")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    /**
     * Verifies that GET /api/stock-history/reason/{reason} returns history filtered by stock change reason.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testGetByReason_shouldReturnHistory(String role) throws Exception {
        when(stockHistoryService.getByReason(StockChangeReason.SOLD)).thenReturn(List.of(history));

        mockMvc.perform(get("/api/stock-history/reason/SOLD")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].reason").value("SOLD"));
    }

    /**
     * Verifies that GET /api/stock-history/search with filters returns a paged list of results.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
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
     * Verifies that GET /api/stock-history returns an empty list when no history records exist.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testGetAll_whenEmpty_shouldReturnEmptyList(String role) throws Exception {
        when(stockHistoryService.getAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/stock-history")
                .with(user("mockuser").roles(role)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));
    }

    /**
     * Verifies that GET /api/stock-history/search returns an empty result when filters match no data.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
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
     * Verifies that GET /api/stock-history/reason/{reason} returns 400 Bad Request
     * when the reason is not a valid enum.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testGetByReason_withInvalidEnum_shouldReturnBadRequest(String role) throws Exception {
        mockMvc.perform(get("/api/stock-history/reason/INVALID_REASON")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Verifies that GET /api/stock-history/search with no parameters still returns a valid page.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testSearch_withNoParams_shouldReturnPage(String role) throws Exception {
        Page<StockHistoryDTO> page = new PageImpl<>(List.of(history));
        when(stockHistoryService.findFiltered(any(), any(), any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/stock-history/search")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    /**
     * Verifies that GET /api/stock-history/search with only item name returns a page of results.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
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
     * Verifies that GET /api/stock-history/reason/{reason} returns 400 Bad Request
     * if the reason is a lowercase (invalid enum format).
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testGetByReason_withLowercase_shouldReturnBadRequest(String role) throws Exception {
        mockMvc.perform(get("/api/stock-history/reason/sold")  // Should be "SOLD"
                .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
    }
}
/**
 * This class contains integration tests for the StockHistoryController,
 * ensuring that all endpoints behave as expected under various conditions.
 * It uses MockMvc to simulate HTTP requests and verify responses.
 */