package com.smartsupplypro.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.dto.*;
import com.smartsupplypro.inventory.service.AnalyticsService;

import org.junit.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
/**
 * Integration tests for the {@link com.smartsupplypro.inventory.controller.AnalyticsController}.
 * <p>
 * This test class validates the REST endpoints exposed by the analytics controller,
 * ensuring proper response structures, filtering logic, authentication handling,
 * and coverage for both ADMIN and USER roles.
 * <p>
 * Includes:
 * <ul>
 *   <li>Role-based access tests</li>
 *   <li>Default and custom filter usage</li>
 *   <li>Validation of HTTP status codes and JSON responses</li>
 *   <li>Authentication and authorization checks</li>
 * </ul>
 * <p>
 * This is critical for enterprise-level auditability, access control, and frontend dashboard consumption.
 */
@WebMvcTest(AnalyticsController.class)
@Import({TestSecurityConfig.class})
public class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AnalyticsService analyticsService;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Verifies that the endpoint returns the correct stock totals per supplier
     * for both ADMIN and USER roles.
     * Ensures JSON array structure and correct mapping of supplier names.
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
     * Tests retrieval of low stock items with supplier ID provided.
     * Ensures correct mapping and HTTP 200 response.
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
     * Tests that missing required query parameter (supplierId) results in HTTP 400.
     */
    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void shouldReturn400WhenSupplierIdMissingInLowStock(String role) throws Exception {
        mockMvc.perform(get("/api/analytics/low-stock-items")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Tests stock movement aggregation over a date range.
     * Verifies correct date parsing and content returned.
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
     * Verifies frequency of item updates based on change history.
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
     * Ensures that missing supplierId results in HTTP 400 for update frequency endpoint.
     */
    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void shouldReturn400WhenSupplierIdMissingInUpdateFrequency(String role) throws Exception {
        mockMvc.perform(get("/api/analytics/item-update-frequency")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Tests filter-based stock update retrieval using POST body.
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
     * Tests that filtered stock update results are returned correctly using GET parameters.
     * Ensures that both ADMIN and USER roles receive valid data with proper filtering.
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
     * Verifies that default start date is used when missing in POST filter for stock updates.
     * Confirms that analytics service still returns expected result.
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
     * Ensures default start date is used when GET request for stock updates omits startDate parameter.
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
     * Ensures default end date is used when POST request for stock updates omits endDate parameter.
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
     * Validates that an empty result is returned when no filters are provided for stock updates via GET.
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
     * Tests that a bad request (400) is returned when an invalid startDate format is used.
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
     * Verifies access control by ensuring a user with no roles receives a 403 Forbidden.
     */
    @Test
    void shouldReturn403WhenAccessingWithoutRoles() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-per-supplier"))
           .andExpect(status().isForbidden());
    }
    /**
     * Tests handling of empty POST body for stock updates. Should return empty list with status 200.
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
     * Ensures a 401 Unauthorized is returned when accessing endpoint without authentication.
     */
    @Test
    void shouldReturn401WhenNoAuth() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-per-supplier"))
                .andExpect(status().isUnauthorized());
    }
    /**
     * Validates that the dashboard summary endpoint returns all four key analytics components
     * for authorized roles using the provided supplierId.
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

}
