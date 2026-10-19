package com.smartsupplypro.inventory.controller.security;

import java.time.LocalDate;
import java.util.Collections;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.Mockito;
import static org.mockito.Mockito.when;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import static org.springframework.security.config.Customizer.withDefaults;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import com.smartsupplypro.inventory.controller.analytics.AnalyticsControllerValidationHelper;
import com.smartsupplypro.inventory.controller.analytics.AnalyticsDashboardHelper;
import com.smartsupplypro.inventory.service.impl.analytics.FinancialAnalyticsService;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

@TestConfiguration
@EnableMethodSecurity
class AnalyticsSecurityTestSupport {

    @Bean
    StockAnalyticsService stockAnalyticsService() {
        StockAnalyticsService mock = Mockito.mock(StockAnalyticsService.class);
        when(mock.getFilteredStockUpdates(any())).thenReturn(Collections.emptyList());
        when(mock.getTotalStockPerSupplier()).thenReturn(Collections.emptyList());
        when(mock.getItemsBelowMinimumStock(anyString())).thenReturn(Collections.emptyList());
        when(mock.getMonthlyStockMovement(any(LocalDate.class), any(LocalDate.class), anyString())).thenReturn(Collections.emptyList());
        when(mock.getItemUpdateFrequency(anyString())).thenReturn(Collections.emptyList());
        when(mock.getTotalStockValueOverTime(any(LocalDate.class), any(LocalDate.class), anyString())).thenReturn(Collections.emptyList());
        when(mock.getPriceTrend(anyString(), anyString(), any(LocalDate.class), any(LocalDate.class))).thenReturn(Collections.emptyList());
        when(mock.getReasonBreakdown(any(), any(), any(), any())).thenReturn(Collections.emptyList());
        return mock;
    }

    @Bean
    FinancialAnalyticsService financialAnalyticsService() {
        FinancialAnalyticsService mock = Mockito.mock(FinancialAnalyticsService.class);
        when(mock.getFinancialSummaryWAC(any(LocalDate.class), any(LocalDate.class), anyString()))
            .thenReturn(com.smartsupplypro.inventory.dto.FinancialSummaryDTO.builder().build());
        return mock;
    }

    // The helper has no dependencies and no side effects: the real one, not a stub
    @Bean
    AnalyticsControllerValidationHelper analyticsControllerValidationHelper() {
        return new AnalyticsControllerValidationHelper();
    }

    @Bean
    AnalyticsDashboardHelper analyticsDashboardHelper() {
        AnalyticsDashboardHelper mock = Mockito.mock(AnalyticsDashboardHelper.class);
        when(mock.buildDashboardSummary(anyString(), any(), any()))
            .thenReturn(com.smartsupplypro.inventory.dto.DashboardSummaryDTO.builder().build());
        return mock;
    }

    // Admits any authenticated user to /api/analytics/**; challenges anonymous requests.
    // Form login and CSRF are disabled for API testing; HTTP Basic is used to simulate auth in tests.
    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/analytics/**").authenticated()
                    .anyRequest().permitAll())
            .httpBasic(withDefaults())
            .formLogin(form -> form.disable());
        return http.build();
    }
}
