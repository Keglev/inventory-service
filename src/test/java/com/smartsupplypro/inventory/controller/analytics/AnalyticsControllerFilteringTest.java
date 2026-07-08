package com.smartsupplypro.inventory.controller.analytics;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.ObjectMapper;
import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.StockUpdateAnalyticsController;
import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

/**
 * Tests {@link StockUpdateAnalyticsController} GET and POST filtering endpoints using {@link MockMvc},
 * covering date-range defaults, parameter validation, and filter criteria processing.
 */
@WebMvcTest(StockUpdateAnalyticsController.class)
@Import({TestSecurityConfig.class, GlobalExceptionHandler.class})
public class AnalyticsControllerFilteringTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StockAnalyticsService stockAnalyticsService;

    @MockitoBean
    private AnalyticsControllerValidationHelper validationHelper;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setup() {
        // applyDefaultDateWindow must return a non-null array; the controller indexes into it immediately
        when(validationHelper.applyDefaultDateWindow(any(), any())).thenAnswer(inv -> {
            LocalDateTime start = inv.getArgument(0);
            LocalDateTime end = inv.getArgument(1);
            if (start == null) start = LocalDateTime.now().minusDays(30);
            if (end == null) end = LocalDateTime.now();
            return new LocalDateTime[] { start, end };
        });
        // GET endpoint calls buildFilter(); return a non-null DTO so the service stub can match it
        when(validationHelper.buildFilter(any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(new StockUpdateFilterDTO());
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void shouldReturnFilteredStockUpdatesViaPost(String role) throws Exception {
        List<StockUpdateResultDTO> sample = List.of(
            new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
        );
        when(stockAnalyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);

        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setItemName("ItemX");
        filter.setSupplierId("Supplier A");
        filter.setStartDate(LocalDateTime.now().minusDays(10));
        filter.setEndDate(LocalDateTime.now());

        mockMvc.perform(post("/api/analytics/stock-updates/query")
                .with(user("mockuser").roles(role))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(filter)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].itemName").value("ItemX"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void shouldReturnFilteredStockUpdatesViaGet(String role) throws Exception {
        List<StockUpdateResultDTO> sample = List.of(
            new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
        );
        when(stockAnalyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);

        mockMvc.perform(get("/api/analytics/stock-updates")
                .with(user("mockuser").roles(role))
                .param("startDate", "2024-05-01T00:00:00")
                .param("endDate", "2024-05-15T23:59:59")
                .param("itemName", "ItemX")
                .param("supplierId", "Supplier A"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].itemName").value("ItemX"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void shouldUseDefaultDateWhenMissingStartDateInPost(String role) throws Exception {
        List<StockUpdateResultDTO> sample = List.of(
            new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
        );
        when(stockAnalyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);

        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setEndDate(LocalDateTime.now());

        mockMvc.perform(post("/api/analytics/stock-updates/query")
                .with(user("mockuser").roles(role))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(filter)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].itemName").value("ItemX"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void shouldUseDefaultDateWhenMissingStartDateInGet(String role) throws Exception {
        List<StockUpdateResultDTO> sample = List.of(
            new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
        );
        when(stockAnalyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);

        mockMvc.perform(get("/api/analytics/stock-updates")
                .with(user("mockuser").roles(role))
                .param("endDate", "2024-05-15T23:59:59")
                .param("itemName", "ItemX"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].itemName").value("ItemX"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void shouldUseDefaultDateWhenMissingEndDateInPost(String role) throws Exception {
        List<StockUpdateResultDTO> sample = List.of(
            new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
        );
        when(stockAnalyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);

        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setStartDate(LocalDateTime.now().minusDays(10));

        mockMvc.perform(post("/api/analytics/stock-updates/query")
                .with(user("mockuser").roles(role))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(filter)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].itemName").value("ItemX"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void shouldReturnEmptyWhenNoFiltersProvidedInGet(String role) throws Exception {
        when(stockAnalyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class)))
            .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/analytics/stock-updates")
                .with(user("mockuser").roles(role)))
            .andExpect(status().isOk())
            .andExpect(content().json("[]"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void shouldReturn400WhenStartDateFormatInvalidInGet(String role) throws Exception {
        mockMvc.perform(get("/api/analytics/stock-updates")
                .with(user("mockuser").roles(role))
                .param("startDate", "invalid-date"))
            .andExpect(status().isBadRequest());
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void shouldReturnEmptyListWhenPostBodyMissing(String role) throws Exception {
        mockMvc.perform(post("/api/analytics/stock-updates/query")
                .with(user("mockuser").roles(role))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isOk())
            .andExpect(content().json("[]"));
    }
}
