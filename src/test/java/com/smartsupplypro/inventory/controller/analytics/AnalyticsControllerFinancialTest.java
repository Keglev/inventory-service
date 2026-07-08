package com.smartsupplypro.inventory.controller.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.AnalyticsController;
import com.smartsupplypro.inventory.controller.StockAnalyticsController;
import com.smartsupplypro.inventory.dto.DashboardSummaryDTO;
import com.smartsupplypro.inventory.dto.FinancialSummaryDTO;
import com.smartsupplypro.inventory.dto.ItemUpdateFrequencyDTO;
import com.smartsupplypro.inventory.dto.LowStockItemDTO;
import com.smartsupplypro.inventory.dto.MonthlyStockMovementDTO;
import com.smartsupplypro.inventory.dto.StockPerSupplierDTO;
import com.smartsupplypro.inventory.exception.BusinessExceptionHandler;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.impl.analytics.FinancialAnalyticsService;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

/**
 * Tests {@link AnalyticsController} dashboard and financial summary endpoints, and
 * {@link StockAnalyticsController} stock-value endpoint, using {@link MockMvc}.
 */
@WebMvcTest({AnalyticsController.class, StockAnalyticsController.class})
@Import({TestSecurityConfig.class, BusinessExceptionHandler.class, GlobalExceptionHandler.class})
public class AnalyticsControllerFinancialTest {

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
        // applyDefaultDateWindow must return a non-null array; the controller indexes into it immediately
        when(validationHelper.applyDefaultDateWindow(any(), any())).thenAnswer(inv -> {
            LocalDateTime start = inv.getArgument(0);
            LocalDateTime end = inv.getArgument(1);
            if (start == null) start = LocalDateTime.now().minusDays(30);
            if (end == null) end = LocalDateTime.now();
            return new LocalDateTime[] { start, end };
        });

        // throw on invalid date range so financialSummary_fromAfterTo_returnsBadRequest can verify the 400
        doAnswer(inv -> {
            LocalDate from = inv.getArgument(0);
            LocalDate to = inv.getArgument(1);
            if (from != null && to != null && from.isAfter(to)) {
                throw new com.smartsupplypro.inventory.exception.InvalidRequestException("Start date must be before or equal to end date");
            }
            return null;
        }).when(validationHelper).validateDateRange(any(LocalDate.class), any(LocalDate.class), anyString(), anyString());

        doAnswer(inv -> {
            LocalDateTime from = inv.getArgument(0);
            LocalDateTime to = inv.getArgument(1);
            if (from != null && to != null && from.isAfter(to)) {
                throw new com.smartsupplypro.inventory.exception.InvalidRequestException("Start date must be before or equal to end date");
            }
            return null;
        }).when(validationHelper).validateDateTimeRange(any(), any(), anyString(), anyString());

        when(stockAnalyticsService.getTotalStockValueOverTime(any(), any(), any()))
            .thenReturn(Collections.emptyList());
    }

    @WithMockUser
    @Test
    void stockValue_ok_withAuthenticatedUser() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-value")
                .param("start", "2025-08-01")
                .param("end", "2025-08-31"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void shouldReturnDashboardSummaryWithDefaults(String role) throws Exception {
        DashboardSummaryDTO summary = DashboardSummaryDTO.builder()
                .stockPerSupplier(List.of(new StockPerSupplierDTO("Supplier A", 100)))
                .lowStockItems(List.of(new LowStockItemDTO("ItemX", 5, 10)))
                .monthlyStockMovement(List.of(new MonthlyStockMovementDTO("2024-05", 20L, 10L)))
                .topUpdatedItems(List.of(new ItemUpdateFrequencyDTO("ItemX", 3)))
                .build();

        when(dashboardHelper.buildDashboardSummary(anyString(), any(), any())).thenReturn(summary);

        mockMvc.perform(get("/api/analytics/summary")
                .with(user("mockuser").roles(role))
                .param("supplierId", "supplier-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.stockPerSupplier.length()").value(1))
            .andExpect(jsonPath("$.lowStockItems.length()").value(1))
            .andExpect(jsonPath("$.monthlyStockMovement.length()").value(1))
            .andExpect(jsonPath("$.topUpdatedItems.length()").value(1));
    }

    @Test
    void financialSummary_returnsOk() throws Exception {
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

        when(financialAnalyticsService.getFinancialSummaryWAC(
            eq(LocalDate.parse("2024-02-01")),
            eq(LocalDate.parse("2024-02-28")),
            isNull()
        )).thenReturn(dto);

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

        verify(financialAnalyticsService).getFinancialSummaryWAC(
            eq(LocalDate.parse("2024-02-01")),
            eq(LocalDate.parse("2024-02-28")),
            isNull()
        );
    }

    @Test
    void financialSummary_unauthenticated_isUnauthorized() throws Exception {
        mockMvc.perform(get("/api/analytics/financial/summary")
                .param("from", "2024-02-01")
                .param("to", "2024-02-28"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void financialSummary_fromAfterTo_returnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/analytics/financial/summary")
                .param("from", "2024-03-01")
                .param("to", "2024-02-01")
                .with(user("tester").roles("ADMIN")))
            .andExpect(status().isBadRequest());
    }
}
