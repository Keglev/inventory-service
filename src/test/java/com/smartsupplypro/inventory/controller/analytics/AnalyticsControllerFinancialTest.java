package com.smartsupplypro.inventory.controller.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.notNull;
import static org.mockito.Mockito.doCallRealMethod;
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
        // The real defaults: a hand-written stub here filled both bounds and hid B2 (a lone date -> 500)
        when(validationHelper.completeDateWindow(any(), any())).thenCallRealMethod();

        // the real summary-window check, not a hand-written copy of it (R51)
        doCallRealMethod().when(validationHelper)
            .validateDateTimeRange(any(), any(), anyString(), anyString());

        when(stockAnalyticsService.getTotalStockValueOverTime(any(), any(), any()))
            .thenReturn(Collections.emptyList());
    }

    @WithMockUser
    @Test
    void should_return_the_stock_value_when_the_user_is_authenticated() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-value")
                .param("start", "2025-08-01")
                .param("end", "2025-08-31"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void should_return_the_dashboard_summary_when_no_parameters_are_given(String role) throws Exception {
        DashboardSummaryDTO summary = DashboardSummaryDTO.builder()
                .stockPerSupplier(List.of(new StockPerSupplierDTO("Supplier A", 100, BigDecimal.TEN)))
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

    @WithMockUser
    @Test
    void should_end_the_window_now_when_only_the_start_date_is_given() throws Exception {
        LocalDateTime start = LocalDateTime.of(2025, 1, 1, 0, 0);

        mockMvc.perform(get("/api/analytics/summary").param("startDate", "2025-01-01T00:00:00"))
            .andExpect(status().isOk());

        verify(dashboardHelper).buildDashboardSummary(isNull(), eq(start), notNull());
    }

    @WithMockUser
    @Test
    void should_start_the_window_30_days_ago_when_only_the_end_date_is_given() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalDateTime end = tomorrow.atTime(12, 0);
        LocalDateTime before = LocalDateTime.now().minusDays(30);

        mockMvc.perform(get("/api/analytics/summary").param("endDate", tomorrow + "T12:00:00"))
            .andExpect(status().isOk());

        ArgumentCaptor<LocalDateTime> startCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(dashboardHelper).buildDashboardSummary(isNull(), startCaptor.capture(), eq(end));
        assertFalse(startCaptor.getValue().isBefore(before));
    }

    @Test
    void should_return_the_financial_summary_when_the_range_is_valid() throws Exception {
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
    void should_return_401_when_the_financial_summary_is_requested_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/analytics/financial/summary")
                .param("from", "2024-02-01")
                .param("to", "2024-02-28"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void should_return_400_when_from_is_after_to() throws Exception {
        // the check lives in the service: run the real method behind the mock
        when(financialAnalyticsService.getFinancialSummaryWAC(any(), any(), any())).thenCallRealMethod();

        mockMvc.perform(get("/api/analytics/financial/summary")
                .param("from", "2024-03-01")
                .param("to", "2024-02-01")
                .with(user("tester").roles("ADMIN")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("from must be on or before to"));
    }
}
