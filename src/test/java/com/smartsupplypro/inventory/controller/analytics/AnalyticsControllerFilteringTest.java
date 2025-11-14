package com.smartsupplypro.inventory.controller.analytics;

import com.smartsupplypro.inventory.controller.AnalyticsController;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.analytics.AnalyticsControllerValidationHelper;
import com.smartsupplypro.inventory.controller.analytics.AnalyticsDashboardHelper;
import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.impl.analytics.FinancialAnalyticsService;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

/**
 * Stock update filtering tests for analytics audit trail queries.
 * 
 * Tests GET/POST filtering endpoints with date range handling, parameter validation,
 * and default date window behavior. Validates complex filter criteria processing.
 */
@SuppressWarnings("unused")
@WebMvcTest(AnalyticsController.class)
@Import({TestSecurityConfig.class, GlobalExceptionHandler.class})
public class AnalyticsControllerFilteringTest {
        
        @Autowired
        private MockMvc mockMvc;
        
        @MockitoBean
        private StockAnalyticsService stockAnalyticsService;
        
        @MockitoBean
        private FinancialAnalyticsService financialAnalyticsService;
        
        @MockitoBean
        private AnalyticsControllerValidationHelper validationHelper;
        
        @MockitoBean
        private AnalyticsDashboardHelper dashboardHelper;
        
        @Autowired
        private ObjectMapper objectMapper;
        
        @BeforeEach
        void setup() {
                // Configure validation helper to return default date windows
                when(validationHelper.applyDefaultDateWindow(any(), any())).thenAnswer(inv -> {
                        LocalDateTime start = inv.getArgument(0);
                        LocalDateTime end = inv.getArgument(1);
                        if (start == null) start = LocalDateTime.now().minusDays(30);
                        if (end == null) end = LocalDateTime.now();
                        return new LocalDateTime[] { start, end };
                });
        }
        
        /**
         * Tests stock update filtering via POST request body.
         * Validates complex filter criteria with JSON payload.
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturnFilteredStockUpdatesViaPost(String role) throws Exception {
                // Arrange: Sample result and filter criteria
                List<StockUpdateResultDTO> sample = List.of(
                        new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
                );
                when(stockAnalyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);
                
                StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
                filter.setItemName("ItemX");
                filter.setSupplierId("Supplier A");
                filter.setStartDate(LocalDateTime.now().minusDays(10));
                filter.setEndDate(LocalDateTime.now());
                
                // Act & Assert: POST with filter body returns matching results
                mockMvc.perform(post("/api/analytics/stock-updates/query")
                        .with(user("mockuser").roles(role))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(filter)))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$[0].itemName").value("ItemX"));
        }
        
        /**
         * Tests stock update filtering via GET query parameters.
         * Validates parameter-based filtering as alternative to POST.
         */
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
        
        /**
         * Tests default date handling when startDate missing in POST.
         * Controller applies default 30-day window when start date omitted.
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldUseDefaultDateWhenMissingStartDateInPost(String role) throws Exception {
                List<StockUpdateResultDTO> sample = List.of(
                        new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
                );
                when(stockAnalyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);
                
                // Filter with end date only - controller adds default start date
                StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
                filter.setEndDate(LocalDateTime.now());
                
                mockMvc.perform(post("/api/analytics/stock-updates/query")
                        .with(user("mockuser").roles(role))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(filter)))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$[0].itemName").value("ItemX"));
        }
        
        /**
         * Tests default date handling when startDate missing in GET.
         * Consistent behavior with POST endpoint for date window defaults.
         */
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
        
        /**
         * Tests default date handling when endDate missing in POST.
         * Controller uses current timestamp when end date omitted.
         */
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
        
        /**
         * Tests empty result when no filters provided in GET.
         * Prevents expensive unfiltered queries - returns empty result set.
         */
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
        
        /**
         * Tests date format validation in GET parameters.
         * Verifies 400 Bad Request for invalid date format strings.
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturn400WhenStartDateFormatInvalidInGet(String role) throws Exception {
                mockMvc.perform(get("/api/analytics/stock-updates")
                        .with(user("mockuser").roles(role))
                        .param("startDate", "invalid-date"))
                        .andExpect(status().isBadRequest());
        }
        
        /**
         * Tests empty POST body handling.
         * Accepts empty JSON object and returns empty result gracefully.
         */
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
