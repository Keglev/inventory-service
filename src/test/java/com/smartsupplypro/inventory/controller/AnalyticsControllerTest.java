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

@WebMvcTest(AnalyticsController.class)
@Import({TestSecurityConfig.class})
public class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AnalyticsService analyticsService;

    @Autowired
    private ObjectMapper objectMapper;

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

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void shouldReturn400WhenSupplierIdMissingInLowStock(String role) throws Exception {
        mockMvc.perform(get("/api/analytics/low-stock-items")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
    }

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

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void shouldReturn400WhenSupplierIdMissingInUpdateFrequency(String role) throws Exception {
        mockMvc.perform(get("/api/analytics/item-update-frequency")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
    }

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

   @ParameterizedTest
   @ValueSource(strings = {"ADMIN", "USER"})
   void shouldReturn400WhenStartDateFormatInvalidInGet(String role) throws Exception {
        mockMvc.perform(get("/api/analytics/stock-updates")
                .with(user("mockuser").roles(role))
                .param("startDate", "invalid-date"))
                .andExpect(status().isBadRequest());
   }

   @Test
   void shouldReturn403WhenAccessingWithoutRoles() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-per-supplier"))
           .andExpect(status().isForbidden());
   }

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

   @Test
   void shouldReturn401WhenNoAuth() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-per-supplier"))
                .andExpect(status().isUnauthorized());
   }

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
