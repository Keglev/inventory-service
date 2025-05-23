package com.smartsupplypro.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsupplypro.inventory.dto.*;
import com.smartsupplypro.inventory.service.AnalyticsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;

import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AnalyticsController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AnalyticsService analyticsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldReturnStockPerSupplier() throws Exception {
        List<StockPerSupplierDTO> sample = List.of(
                new StockPerSupplierDTO("Supplier A", 100),
                new StockPerSupplierDTO("Supplier B", 50)
        );
        when(analyticsService.getTotalStockPerSupplier()).thenReturn(sample);

        mockMvc.perform(get("/api/analytics/stock-per-supplier"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].supplierName").value("Supplier A"));
    }

    @Test
    void shouldReturnLowStockItems() throws Exception {
        List<LowStockItemDTO> sample = List.of(new LowStockItemDTO("ItemX", 5, 10));
        when(analyticsService.getItemsBelowMinimumStock("s1")).thenReturn(sample);

        mockMvc.perform(get("/api/analytics/low-stock-items?supplierId=s1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].itemName").value("ItemX"));
    }

    @Test
    void shouldReturnMonthlyStockMovement() throws Exception {
        List<MonthlyStockMovementDTO> sample = List.of(
                new MonthlyStockMovementDTO("2024-01", 15L, 5L)
        );
        when(analyticsService.getMonthlyStockMovement(any(), any(), any())).thenReturn(sample);

        mockMvc.perform(get("/api/analytics/monthly-stock-movement?start=2024-01-01&end=2024-01-31&supplierId=s1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].month").value("2024-01"));
    }

    @Test
    void shouldReturnItemUpdateFrequency() throws Exception {
        List<ItemUpdateFrequencyDTO> sample = List.of(new ItemUpdateFrequencyDTO("ItemX", 3));
        when(analyticsService.getItemUpdateFrequency("s1")).thenReturn(sample);

        mockMvc.perform(get("/api/analytics/item-update-frequency?supplierId=s1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].itemName").value("ItemX"));
    }

    @Test
    void shouldReturnFilteredStockUpdates() throws Exception {
        List<StockUpdateResultDTO> sample = List.of(
                new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
        );
        when(analyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);

        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setItemName("ItemX");
        filter.setSupplierId("Supplier A");
        filter.setStartDate(LocalDateTime.now().minusDays(10));
        filter.setEndDate(LocalDateTime.now());

        mockMvc.perform(get("/api/analytics/stock-updates")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(filter)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].itemName").value("ItemX"));
    }
}
