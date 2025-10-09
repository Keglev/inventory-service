package com.smartsupplypro.inventory.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.junit.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
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
import com.smartsupplypro.inventory.dto.FinancialSummaryDTO;
import com.smartsupplypro.inventory.dto.ItemUpdateFrequencyDTO;
import com.smartsupplypro.inventory.dto.LowStockItemDTO;
import com.smartsupplypro.inventory.dto.MonthlyStockMovementDTO;
import com.smartsupplypro.inventory.dto.StockPerSupplierDTO;
import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.AnalyticsService;
/**
 * Web Layer Tests - AnalyticsController Business Intelligence API Validation
 * 
 * BUSINESS SCOPE:
 * - Analytics dashboard API contract validation for financial reporting
 * - Business intelligence endpoint security and role-based access control  
 * - Stock movement analytics and supplier performance metrics validation
 * - Low stock alerts and inventory optimization features testing
 * 
 * TECHNICAL SCOPE:
 * - MockMvc slice testing with mocked AnalyticsService for isolated web layer validation
 * - Complex DTO response structure validation for dashboard consumption
 * - Parameter filtering logic and date range validation testing
 * - Authentication boundary testing with ADMIN vs USER role differentiation
 * 
 * ENTERPRISE PATTERNS:
 * - Parameterized testing for role-based access validation across endpoints
 * - JSON response structure validation for frontend dashboard integration
 * - Business logic isolation through service layer mocking
 * - Comprehensive security boundary testing for sensitive financial data
 * 
 * CROSS-REFERENCES:
 * - Service layer logic: {@link com.smartsupplypro.inventory.service.impl.AnalyticsServiceImplTest}
 * - Complex analytics: {@link com.smartsupplypro.inventory.service.impl.AnalyticsServiceImplWacTest}
 * - Controller implementation: {@link AnalyticsController}
 * - Security configuration: {@link com.smartsupplypro.inventory.config.TestSecurityConfig}
 * 
 * @author SmartSupplyPro Development Team
 * @since 1.0.0
 * @see AnalyticsController
 * @see com.smartsupplypro.inventory.service.AnalyticsService
 */
@WebMvcTest(AnalyticsController.class)
@Import({TestSecurityConfig.class, GlobalExceptionHandler.class})
public class AnalyticsControllerTest {
        
        /** MockMvc for HTTP request simulation and analytics API contract validation */
        @Autowired
        private MockMvc mockMvc;
        
        /** Mocked analytics service - isolates web layer testing from complex business calculations */
        @MockitoBean
        private AnalyticsService analyticsService;
        
        /** Jackson ObjectMapper for JSON serialization in analytics response testing */
        @Autowired
        private ObjectMapper objectMapper;
        
        /**
         * Validates stock aggregation per supplier endpoint for dashboard consumption.
         * Given: ADMIN or USER role authentication
         * When: GET /api/analytics/stock-per-supplier
         * Then: Returns 200 with supplier stock totals array
         * 
         * // ENTERPRISE: Core dashboard metric - both roles need access for reporting
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturnStockPerSupplier(String role) throws Exception {
                List<StockPerSupplierDTO> sample = List.of(
                new StockPerSupplierDTO("Supplier A", 100),
                new StockPerSupplierDTO("Supplier B", 50)
                );
                when(analyticsService.getTotalStockPerSupplier()).thenReturn(sample);
                
                mockMvc.perform(
                get("/api/analytics/stock-per-supplier")
                .with(user("mockuser").roles(role))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].supplierName").value("Supplier A"));
        }
        
        /**
         * Tests low stock items endpoint with supplier filtering.
         * Given: Valid supplierId parameter and authenticated user
         * When: GET /api/analytics/low-stock-items?supplierId=s1
         * Then: Returns 200 with filtered low stock items
         * 
         * // ENTERPRISE: Critical for inventory management - prevents stockouts
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturnLowStockItems(String role) throws Exception {
                List<LowStockItemDTO> sample = List.of(new LowStockItemDTO("ItemX", 5, 10));
                when(analyticsService.getItemsBelowMinimumStock("s1")).thenReturn(sample);
                
                mockMvc.perform(get("/api/analytics/low-stock-items?supplierId=s1")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].itemName").value("ItemX"));
        }
        
        /**
         * Validates required parameter validation for low stock endpoint.
         * Given: Missing required supplierId parameter
         * When: GET /api/analytics/low-stock-items (no params)
         * Then: Returns 400 Bad Request
         * 
         * // ENTERPRISE: Parameter validation prevents meaningless queries
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturn400WhenSupplierIdMissingInLowStock(String role) throws Exception {
                mockMvc.perform(get("/api/analytics/low-stock-items")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
        }
        
        /**
         * Tests monthly stock movement analytics with date range filtering.
         * Given: Valid date range and supplier ID parameters
         * When: GET /api/analytics/monthly-stock-movement with date params
         * Then: Returns 200 with monthly aggregated movement data
         * 
         * // ENTERPRISE: Time-series analytics for inventory trend analysis
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturnMonthlyStockMovement(String role) throws Exception {
                List<MonthlyStockMovementDTO> sample = List.of(
                new MonthlyStockMovementDTO("2024-01", 15L, 5L)
                );
                when(analyticsService.getMonthlyStockMovement(any(), any(), any())).thenReturn(sample);
                
                mockMvc.perform(get("/api/analytics/monthly-stock-movement?start=2024-01-01&end=2024-01-31&supplierId=s1")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].month").value("2024-01"));
        }
        
        /**
         * Tests item update frequency analytics for tracking change patterns.
         * Given: Valid supplierId parameter and authenticated user
         * When: GET /api/analytics/item-update-frequency?supplierId=s1
         * Then: Returns 200 with item update frequency metrics
         * 
         * // ENTERPRISE: Operational analytics for identifying high-maintenance items
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturnItemUpdateFrequency(String role) throws Exception {
                List<ItemUpdateFrequencyDTO> sample = List.of(new ItemUpdateFrequencyDTO("ItemX", 3));
                when(analyticsService.getItemUpdateFrequency("s1")).thenReturn(sample);
                
                mockMvc.perform(get("/api/analytics/item-update-frequency?supplierId=s1")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].itemName").value("ItemX"));
        }
        
        /**
         * Validates parameter requirement for item update frequency endpoint.
         * Given: Missing required supplierId parameter
         * When: GET /api/analytics/item-update-frequency (no params)
         * Then: Returns 400 Bad Request
         * 
         * // ENTERPRISE: Prevents expensive queries without proper filtering
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturn400WhenSupplierIdMissingInUpdateFrequency(String role) throws Exception {
                mockMvc.perform(get("/api/analytics/item-update-frequency")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
        }
        
        /**
         * Tests complex stock update filtering with POST request body.
         * Given: Valid filter criteria in request body
         * When: POST /api/analytics/stock-updates/query with filter DTO
         * Then: Returns 200 with filtered stock update results
         * 
         * // ENTERPRISE: Advanced filtering for detailed audit trail analysis
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturnFilteredStockUpdatesViaPost(String role) throws Exception {
                List<StockUpdateResultDTO> sample = List.of(
                new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
                );
                when(analyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);
                
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

        /**
         * Tests stock value analytics endpoint with authenticated user (any role).
         * Given: Any authenticated user with date range parameters
         * When: GET /api/analytics/stock-value?start=2025-08-01&end=2025-08-31
         * Then: Returns 200 with JSON stock value data
         * 
         * // ENTERPRISE: Financial reporting accessible to all authenticated users
         */
        @WithMockUser // no roles on purpose; should still be authenticated
        @Test
        void stockValue_ok_withAuthenticatedUser() throws Exception {
                mockMvc.perform(get("/api/analytics/stock-value")
                     .param("start", "2025-08-01")
                     .param("end", "2025-08-31"))
                   .andExpect(status().isOk())
                   .andExpect(content().contentType(MediaType.APPLICATION_JSON));
        }

        /**
         * Tests filtered stock updates endpoint using GET parameters.
         * Given: ADMIN or USER role with query parameters
         * When: GET /api/analytics/stock-updates with filtering params
         * Then: Returns 200 with filtered stock update results
         * 
         * // ENTERPRISE: Flexible querying for operational monitoring
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturnFilteredStockUpdatesViaGet(String role) throws Exception {
                List<StockUpdateResultDTO> sample = List.of(
                new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
                );
                when(analyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);
                
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
         * Tests default date handling when start date missing in POST filter.
         * Given: Filter DTO with endDate but no startDate
         * When: POST /api/analytics/stock-updates/query with partial filter
         * Then: Returns 200 with service using default start date
         * 
         * // ENTERPRISE: Graceful handling of incomplete filter criteria
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldUseDefaultDateWhenMissingStartDateInPost(String role) throws Exception {
                List<StockUpdateResultDTO> sample = List.of(
                new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
                );
                when(analyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);
                
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
         * Tests default date handling when start date missing in GET parameters.
         * Given: GET request with endDate but no startDate parameter
         * When: GET /api/analytics/stock-updates with partial params
         * Then: Returns 200 with service using default start date
         * 
         * // ENTERPRISE: Consistent behavior across GET and POST filtering
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldUseDefaultDateWhenMissingStartDateInGet(String role) throws Exception {
                List<StockUpdateResultDTO> sample = List.of(
                new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
                );
                when(analyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);
                
                mockMvc.perform(get("/api/analytics/stock-updates")
                .with(user("mockuser").roles(role))
                .param("endDate", "2024-05-15T23:59:59")
                .param("itemName", "ItemX"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].itemName").value("ItemX"));
        }
        /**
         * Tests default date handling when end date missing in POST filter.
         * Given: Filter DTO with startDate but no endDate
         * When: POST /api/analytics/stock-updates/query with partial filter
         * Then: Returns 200 with service using default end date
         * 
         * // ENTERPRISE: Robust date range defaulting for user convenience
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldUseDefaultDateWhenMissingEndDateInPost(String role) throws Exception {
                List<StockUpdateResultDTO> sample = List.of(
                new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
                );
                when(analyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);
                
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
         * Tests empty result handling when no filters provided via GET.
         * Given: GET request with no filtering parameters
         * When: GET /api/analytics/stock-updates (no query params)
         * Then: Returns 200 with empty result set
         * 
         * // ENTERPRISE: Performance protection - prevents unfiltered large datasets
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturnEmptyWhenNoFiltersProvidedInGet(String role) throws Exception {
                when(analyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class)))
                .thenReturn(Collections.emptyList());
                
                mockMvc.perform(get("/api/analytics/stock-updates")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
        }
        /**
         * Tests date format validation for GET parameter parsing.
         * Given: Invalid date format in startDate parameter
         * When: GET /api/analytics/stock-updates?startDate=invalid-date
         * Then: Returns 400 Bad Request
         * 
         * // ENTERPRISE: Input validation prevents malformed requests
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
         * Tests role-based access control enforcement.
         * Given: User with no assigned roles
         * When: GET /api/analytics/stock-per-supplier
         * Then: Returns 403 Forbidden
         * 
         * // ENTERPRISE: Security boundary - analytics requires minimum USER role
         */
        @Test
        void shouldReturn403WhenAccessingWithoutRoles() throws Exception {
                mockMvc.perform(get("/api/analytics/stock-per-supplier"))
                .andExpect(status().isForbidden());
        }
        /**
         * Tests handling of empty POST request body for stock updates.
         * Given: Authenticated user with empty JSON object
         * When: POST /api/analytics/stock-updates/query with {}
         * Then: Returns 200 with empty array
         * 
         * // ENTERPRISE: Graceful handling of minimal filter criteria
         */
        @ParameterizedTest
        @ValueSource(strings = {"USER", "ADMIN"})
        void shouldReturnEmptyListWhenPostBodyMissing(String role) throws Exception {
                mockMvc.perform(post("/api/analytics/stock-updates/query")
                .with(user("mockuser").roles(role))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))  // Empty object
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
        }
        /**
         * Tests authentication requirement for analytics endpoints.
         * Given: No authentication context
         * When: GET /api/analytics/stock-per-supplier
         * Then: Returns 401 Unauthorized
         * 
         * // ENTERPRISE: All analytics endpoints require authentication
         */
        @Test
        void shouldReturn401WhenNoAuth() throws Exception {
                mockMvc.perform(get("/api/analytics/stock-per-supplier"))
                .andExpect(status().isUnauthorized());
        }
        /**
         * Tests comprehensive dashboard summary endpoint with all analytics components.
         * Given: Valid supplierId parameter and authenticated user
         * When: GET /api/analytics/summary?supplierId=supplier-1
         * Then: Returns 200 with complete dashboard data structure
         * 
         * // ENTERPRISE: One-stop dashboard API for executive reporting
         */
        @ParameterizedTest
        @ValueSource(strings = {"ADMIN", "USER"})
        void shouldReturnDashboardSummaryWithDefaults(String role) throws Exception {
                List<StockPerSupplierDTO> stock = List.of(new StockPerSupplierDTO("Supplier A", 100));
                List<LowStockItemDTO> lowStock = List.of(new LowStockItemDTO("ItemX", 5, 10));
                List<MonthlyStockMovementDTO> movement = List.of(new MonthlyStockMovementDTO("2024-05", 20L, 10L));
                List<ItemUpdateFrequencyDTO> updates = List.of(new ItemUpdateFrequencyDTO("ItemX", 3));
                
                when(analyticsService.getTotalStockPerSupplier()).thenReturn(stock);
                when(analyticsService.getItemsBelowMinimumStock(any())).thenReturn(lowStock);
                when(analyticsService.getMonthlyStockMovement(any(), any(), any())).thenReturn(movement);
                when(analyticsService.getItemUpdateFrequency(any())).thenReturn(updates);
                
                mockMvc.perform(get("/api/analytics/summary")
                .with(user("mockuser").roles(role))
                .param("supplierId", "supplier-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stockPerSupplier.length()").value(1))
                .andExpect(jsonPath("$.lowStockItems.length()").value(1))
                .andExpect(jsonPath("$.monthlyStockMovement.length()").value(1))
                .andExpect(jsonPath("$.topUpdatedItems.length()").value(1));
        }
        
        /**
         * Tests financial summary endpoint with WAC (Weighted Average Cost) calculation.
         * Given: ADMIN role with valid date range parameters
         * When: GET /api/analytics/financial/summary?from=2024-02-01&to=2024-02-28
         * Then: Returns 200 with complete financial summary DTO
         * 
         * // ENTERPRISE: Critical financial reporting endpoint for cost accounting
         * // WAC: Weighted Average Cost method for inventory valuation compliance
         */
        @org.junit.jupiter.api.Test
        void financialSummary_returnsOk() throws Exception {
                // Arrange
                FinancialSummaryDTO dto = FinancialSummaryDTO.builder()
                .method("WAC")
                .fromDate("2024-02-01")
                .toDate("2024-02-28")
                .openingQty(10).openingValue(new BigDecimal("50.00"))
                .purchasesQty(5).purchasesCost(new BigDecimal("30.00"))
                .returnsInQty(1).returnsInCost(new BigDecimal("6.00"))
                .cogsQty(8).cogsCost(new BigDecimal("48.00"))
                .writeOffQty(1).writeOffCost(new BigDecimal("6.00"))
                .endingQty(7).endingValue(new BigDecimal("42.00"))
                .build();
                
                when(analyticsService.getFinancialSummaryWAC(
                eq(LocalDate.parse("2024-02-01")),
                eq(LocalDate.parse("2024-02-28")),
                isNull()
                )).thenReturn(dto);
                
                // Act + Assert
                mockMvc.perform(get("/api/analytics/financial/summary")
                .param("from", "2024-02-01")
                .param("to", "2024-02-28")
                .with(user("tester").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.method").value("WAC"))
                .andExpect(jsonPath("$.fromDate").value("2024-02-01"))
                .andExpect(jsonPath("$.toDate").value("2024-02-28"))
                .andExpect(jsonPath("$.openingQty").value(10))
                .andExpect(jsonPath("$.endingQty").value(7));
                
                verify(analyticsService).getFinancialSummaryWAC(
                eq(LocalDate.parse("2024-02-01")),
                eq(LocalDate.parse("2024-02-28")),
                isNull()
                );
        }
        
        /**
         * Tests authentication requirement for financial summary endpoint.
         * Given: No authentication context
         * When: GET /api/analytics/financial/summary with date params
         * Then: Returns 401 Unauthorized
         * 
         * // ENTERPRISE: Financial data requires strict authentication
         */
        @org.junit.jupiter.api.Test
        void financialSummary_unauthenticated_isUnauthorized() throws Exception {
                mockMvc.perform(get("/api/analytics/financial/summary")
                        .param("from", "2024-02-01")
                        .param("to", "2024-02-28"))
                .andExpect(status().isUnauthorized()); // change to isForbidden() if your app returns 403
        }
        /**
         * Tests date range validation for financial summary endpoint.
         * Given: Invalid date range where from > to
         * When: GET /api/analytics/financial/summary?from=2024-03-01&to=2024-02-01
         * Then: Returns 400 Bad Request via service exception
         * 
         * // ENTERPRISE: Business rule validation prevents invalid date ranges
         */
        @org.junit.jupiter.api.Test
        void financialSummary_fromAfterTo_returnsBadRequest() throws Exception {
                when(analyticsService.getFinancialSummaryWAC(any(), any(), any()))
                        .thenThrow(new com.smartsupplypro.inventory.exception.InvalidRequestException("from > to"));
                
                mockMvc.perform(get("/api/analytics/financial/summary")
                        .param("from", "2024-03-01")
                        .param("to", "2024-02-01")
                        .with(user("tester").roles("ADMIN")))
                .andExpect(status().isBadRequest());
        }
}
