package com.smartsupplypro.inventory.controller.security;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.Mockito;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import static org.springframework.security.config.Customizer.withDefaults;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.smartsupplypro.inventory.controller.AnalyticsController;
import com.smartsupplypro.inventory.controller.StockAnalyticsController;
import com.smartsupplypro.inventory.controller.StockUpdateAnalyticsController;
import com.smartsupplypro.inventory.controller.analytics.AnalyticsControllerValidationHelper;
import com.smartsupplypro.inventory.controller.analytics.AnalyticsDashboardHelper;
import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.service.impl.analytics.FinancialAnalyticsService;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

/**
 * Shared MockMvc and Spring Security context for analytics controller security tests.
 */
@WebMvcTest(
        controllers = {
            AnalyticsController.class,
            StockAnalyticsController.class,
            StockUpdateAnalyticsController.class
        },
        excludeAutoConfiguration = {
                OAuth2ResourceServerAutoConfiguration.class
        }
)
@AutoConfigureMockMvc(addFilters = true)
@ActiveProfiles("test")
@Import(AbstractAnalyticsControllerSecurityTest.TestSupport.class)
public abstract class AbstractAnalyticsControllerSecurityTest {

    protected static final String USER = "USER";

    @Autowired
    protected MockMvc mockMvc;

    @TestConfiguration
    @EnableMethodSecurity
    static class TestSupport {

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
            return mock;
        }

        @Bean
        FinancialAnalyticsService financialAnalyticsService() {
            FinancialAnalyticsService mock = Mockito.mock(FinancialAnalyticsService.class);
            when(mock.getFinancialSummaryWAC(any(LocalDate.class), any(LocalDate.class), anyString()))
                .thenReturn(com.smartsupplypro.inventory.dto.FinancialSummaryDTO.builder().build());
            return mock;
        }

        @Bean
        AnalyticsControllerValidationHelper analyticsControllerValidationHelper() {
            AnalyticsControllerValidationHelper mock = Mockito.mock(AnalyticsControllerValidationHelper.class);
            // applyDefaultDateWindow must return a non-null array; the controller indexes into it immediately
            when(mock.applyDefaultDateWindow(any(), any())).thenAnswer(invocation -> {
                LocalDateTime start = invocation.getArgument(0);
                LocalDateTime end = invocation.getArgument(1);
                if (start == null) start = LocalDateTime.now().minusDays(30);
                if (end == null) end = LocalDateTime.now();
                return new LocalDateTime[] { start, end };
            });
            when(mock.buildFilter(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new StockUpdateFilterDTO());
            return mock;
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
}
