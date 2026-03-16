package com.smartsupplypro.inventory.controller.stockhistory;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
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
 * # StockHistoryControllerEndpointsTest
 *
 * MVC tests for basic Stock History endpoints in {@link StockHistoryController}.
 *
 * <p><strong>Purpose</strong></p>
 * Validate the HTTP contract for retrieving stock-change audit trail data. These endpoints are
 * used for traceability (who changed stock and why) and support operational and compliance needs.
 *
 * <p><strong>Operations Tested</strong></p>
 * <ul>
 *   <li>{@code GET /api/stock-history}: returns full history (including empty)</li>
 *   <li>{@code GET /api/stock-history/item/{itemId}}: returns history for an item</li>
 *   <li>{@code GET /api/stock-history/reason/{reason}}: filters by change reason</li>
 *   <li>Authentication and enum parsing behavior (invalid / wrong-case reason)</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong></p>
 * <ul>
 *   <li>Uses {@code @WebMvcTest} to exercise controller routing and serialization.</li>
 *   <li>Spring Security filters stay active via {@link TestSecurityConfig}.</li>
 *   <li>Service interactions are mocked to keep tests deterministic.</li>
 * </ul>
 */
@SuppressWarnings("unused")
@Import({TestSecurityConfig.class, GlobalExceptionHandler.class})
@WebMvcTest(StockHistoryController.class)
@ActiveProfiles("test")
class StockHistoryControllerEndpointsTest {

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

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history -> 200 + list")
    void getAll_whenAuthenticated_returnsList(String role) throws Exception {
        // GIVEN
        when(stockHistoryService.getAll()).thenReturn(List.of(history));

        // WHEN/THEN
        mockMvc.perform(get("/api/stock-history")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].reason").value("SOLD"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history -> 200 + [] (empty)")
    void getAll_whenEmpty_returnsEmptyList(String role) throws Exception {
        // GIVEN
        when(stockHistoryService.getAll()).thenReturn(List.of());

        // WHEN/THEN
        mockMvc.perform(get("/api/stock-history")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/item/{itemId} -> 200 + list")
    void getByItemId_whenAuthenticated_returnsHistory(String role) throws Exception {
        // GIVEN
        when(stockHistoryService.getByItemId("item-1")).thenReturn(List.of(history));

        // WHEN/THEN
        mockMvc.perform(get("/api/stock-history/item/item-1")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/reason/{reason} -> 200 + list")
    void getByReason_whenAuthenticated_returnsHistory(String role) throws Exception {
        // GIVEN
        when(stockHistoryService.getByReason(StockChangeReason.SOLD)).thenReturn(List.of(history));

        // WHEN/THEN
        mockMvc.perform(get("/api/stock-history/reason/SOLD")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].reason").value("SOLD"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/reason/{reason} (invalid) -> 400")
    void getByReason_whenInvalidEnum_returnsBadRequest(String role) throws Exception {
        // GIVEN/WHEN/THEN
        mockMvc.perform(get("/api/stock-history/reason/INVALID_REASON")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/reason/{reason} (lowercase) -> 400")
    void getByReason_whenLowercase_returnsBadRequest(String role) throws Exception {
        // GIVEN/WHEN/THEN
        mockMvc.perform(get("/api/stock-history/reason/sold")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/stock-history (no auth) -> 401")
    void getAll_withoutAuthentication_returnsUnauthorized() throws Exception {
        // GIVEN/WHEN/THEN
        mockMvc.perform(get("/api/stock-history"))
                .andExpect(status().isUnauthorized());
    }
}
