package com.smartsupplypro.inventory.controller.analytics;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.AnalyticsController;
import com.smartsupplypro.inventory.dto.ItemUpdateFrequencyDTO;
import com.smartsupplypro.inventory.dto.LowStockItemDTO;
import com.smartsupplypro.inventory.dto.MonthlyStockMovementDTO;
import com.smartsupplypro.inventory.dto.StockPerSupplierDTO;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.impl.analytics.FinancialAnalyticsService;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

/**
 * Basic analytics endpoint tests for stock metrics and inventory monitoring.
 * 
 * Tests stock aggregation, low stock alerts, monthly movements, and update frequency.
 * Validates role-based access and parameter validation for core dashboard features.
 */
@SuppressWarnings("unused")
@WebMvcTest(AnalyticsController.class)
@Import({TestSecurityConfig.class, GlobalExceptionHandler.class})
public class AnalyticsControllerBasicTest {
        
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
         * Tests stock aggregation per supplier endpoint.
         * Validates both ADMIN and USER roles can access supplier stock totals.
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturnStockPerSupplier(String role) throws Exception {
                // Arrange: Mock service returns sample supplier data
                List<StockPerSupplierDTO> sample = List.of(
                        new StockPerSupplierDTO("Supplier A", 100),
                        new StockPerSupplierDTO("Supplier B", 50)
                );
                when(stockAnalyticsService.getTotalStockPerSupplier()).thenReturn(sample);
                
                // Act & Assert: Verify 200 response with correct data structure
                mockMvc.perform(get("/api/analytics/stock-per-supplier")
                        .with(user("mockuser").roles(role)))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.length()").value(2))
                        .andExpect(jsonPath("$[0].supplierName").value("Supplier A"));
        }
        
        /**
         * Tests low stock items endpoint with supplier filtering.
         * Validates filtering by supplierId parameter.
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturnLowStockItems(String role) throws Exception {
                List<LowStockItemDTO> sample = List.of(new LowStockItemDTO("ItemX", 5, 10));
                when(stockAnalyticsService.getItemsBelowMinimumStock("s1")).thenReturn(sample);
                
                mockMvc.perform(get("/api/analytics/low-stock-items?supplierId=s1")
                        .with(user("mockuser").roles(role)))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$[0].itemName").value("ItemX"));
        }
        
        /**
         * Tests parameter validation for low stock endpoint.
         * Verifies 400 error when required supplierId is missing.
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturn400WhenSupplierIdMissingInLowStock(String role) throws Exception {
                mockMvc.perform(get("/api/analytics/low-stock-items")
                        .with(user("mockuser").roles(role)))
                        .andExpect(status().isBadRequest());
        }
        
        /**
         * Tests monthly stock movement analytics with date range.
         * Validates time-series data aggregation for trend analysis.
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturnMonthlyStockMovement(String role) throws Exception {
                List<MonthlyStockMovementDTO> sample = List.of(
                        new MonthlyStockMovementDTO("2024-01", 15L, 5L)
                );
                when(stockAnalyticsService.getMonthlyStockMovement(any(), any(), any())).thenReturn(sample);
                
                mockMvc.perform(get("/api/analytics/monthly-stock-movement")
                        .param("start", "2024-01-01")
                        .param("end", "2024-01-31")
                        .param("supplierId", "s1")
                        .with(user("mockuser").roles(role)))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$[0].month").value("2024-01"));
        }
        
        /**
         * Tests item update frequency analytics.
         * Tracks change patterns to identify high-maintenance items.
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturnItemUpdateFrequency(String role) throws Exception {
                List<ItemUpdateFrequencyDTO> sample = List.of(new ItemUpdateFrequencyDTO("ItemX", 3));
                when(stockAnalyticsService.getItemUpdateFrequency("s1")).thenReturn(sample);
                
                mockMvc.perform(get("/api/analytics/item-update-frequency?supplierId=s1")
                        .with(user("mockuser").roles(role)))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$[0].itemName").value("ItemX"));
        }
        
        /**
         * Tests parameter validation for update frequency endpoint.
         * Verifies 400 error when required supplierId is missing.
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturn400WhenSupplierIdMissingInUpdateFrequency(String role) throws Exception {
                mockMvc.perform(get("/api/analytics/item-update-frequency")
                        .with(user("mockuser").roles(role)))
                        .andExpect(status().isBadRequest());
        }
        
        /**
         * Tests authentication requirement for analytics endpoints.
         * Verifies 401 Unauthorized when no authentication context provided.
         */
        @Test
        void shouldReturn401WhenNoAuth() throws Exception {
                mockMvc.perform(get("/api/analytics/stock-per-supplier"))
                        .andExpect(status().isUnauthorized());
        }
        
        /**
         * Tests that authenticated users can access analytics endpoints.
         * Verifies 200 OK when user is authenticated regardless of roles.
         */
        @Test
        void shouldReturn200WhenAuthenticatedWithoutSpecificRoles() throws Exception {
                mockMvc.perform(get("/api/analytics/stock-per-supplier")
                        .with(user("userWithNoRoles")))
                        .andExpect(status().isOk());
        }
}
