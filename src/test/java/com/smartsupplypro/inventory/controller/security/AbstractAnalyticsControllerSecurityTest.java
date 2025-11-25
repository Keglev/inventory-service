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
import com.smartsupplypro.inventory.controller.analytics.AnalyticsControllerValidationHelper;
import com.smartsupplypro.inventory.controller.analytics.AnalyticsDashboardHelper;
import com.smartsupplypro.inventory.service.impl.analytics.FinancialAnalyticsService;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

/**
 * Abstract base for security slice tests of {@link AnalyticsController}.
 *
 * <p><strong>What this provides:</strong>
 * <ul>
 *   <li>A minimal MVC + Security context targeting {@link AnalyticsController} only.</li>
 *   <li>A test-only security chain that allows any authenticated user (USER/ADMIN) on
 *       <code>/api/analytics/**</code> and challenges anonymous requests.</li>
 *   <li>Mockito-backed service and helper dependencies to satisfy controller wiring.</li>
 * </ul>
 *
 * <p>Concrete endpoint suites extend this base and implement their own request/response assertions.</p>
 */
@WebMvcTest(
        controllers = AnalyticsController.class,
        excludeAutoConfiguration = {
                OAuth2ResourceServerAutoConfiguration.class
        }
)
@AutoConfigureMockMvc(addFilters = true)
@ActiveProfiles("test")
@Import(AbstractAnalyticsControllerSecurityTest.TestSupport.class)
public abstract class AbstractAnalyticsControllerSecurityTest {

    /** Role constant used to simulate a non-admin authenticated user. */
    protected static final String USER = "USER";

    @Autowired
    protected MockMvc mockMvc;

    /**
     * Test-scope support configuration:
     * <ul>
     *   <li>Mocks the specialized analytics services and helpers to decouple security from business logic.</li>
     *   <li>Installs a simple {@link SecurityFilterChain} for the analytics policy.</li>
     * </ul>
     */
    @TestConfiguration
    @EnableMethodSecurity
    static class TestSupport {

        /** Provides Mockito mocks for the service layer dependencies. */
        @Bean
        @SuppressWarnings("unused")
        StockAnalyticsService stockAnalyticsService() {
            StockAnalyticsService mock = Mockito.mock(StockAnalyticsService.class);
            // Configure mock to return empty collections for all methods
            when(mock.getFilteredStockUpdates(any())).thenReturn(Collections.emptyList());
            when(mock.getTotalStockPerSupplier()).thenReturn(Collections.emptyList());
            when(mock.getItemsBelowMinimumStock(anyString())).thenReturn(Collections.emptyList());
            when(mock.getMonthlyStockMovement(any(LocalDate.class), any(LocalDate.class), anyString())).thenReturn(Collections.emptyList());
            when(mock.getItemUpdateFrequency(anyString())).thenReturn(Collections.emptyList());
            when(mock.getTotalStockValueOverTime(any(LocalDate.class), any(LocalDate.class), anyString())).thenReturn(Collections.emptyList());
            when(mock.getPriceTrend(anyString(), anyString(), any(LocalDate.class), any(LocalDate.class))).thenReturn(Collections.emptyList());
            return mock;
        }
        /**
         * Provides a Mockito mock for the financial analytics service.
         * @return
         */
        @Bean
        @SuppressWarnings("unused")
        FinancialAnalyticsService financialAnalyticsService() {
            FinancialAnalyticsService mock = Mockito.mock(FinancialAnalyticsService.class);
            // Configure mock to return empty/default financial summaries
            when(mock.getFinancialSummaryWAC(any(LocalDate.class), any(LocalDate.class), anyString()))
                .thenReturn(new com.smartsupplypro.inventory.dto.FinancialSummaryDTO());
            return mock;
        }
        
        /**
         * Provides a Mockito mock for the analytics controller validation helper.
         * @return
         */
        @Bean
        @SuppressWarnings("unused")
        AnalyticsControllerValidationHelper analyticsControllerValidationHelper() {
            AnalyticsControllerValidationHelper mock = Mockito.mock(AnalyticsControllerValidationHelper.class);
            // Configure mock to return default date window (last 30 days)
            when(mock.applyDefaultDateWindow(any(), any())).thenAnswer(invocation -> {
                LocalDateTime start = invocation.getArgument(0);
                LocalDateTime end = invocation.getArgument(1);
                if (start == null) start = LocalDateTime.now().minusDays(30);
                if (end == null) end = LocalDateTime.now();
                return new LocalDateTime[] { start, end };
            });
            return mock;
        }
        
        @Bean
        @SuppressWarnings("unused")
        AnalyticsDashboardHelper analyticsDashboardHelper() {
            AnalyticsDashboardHelper mock = Mockito.mock(AnalyticsDashboardHelper.class);
            // Configure mock to return empty dashboard summary
            when(mock.buildDashboardSummary(anyString(), any(), any()))
                .thenReturn(new com.smartsupplypro.inventory.dto.DashboardSummaryDTO());
            return mock;
        }

        /**
         * Admits any authenticated user to /api/analytics/** and challenges anonymous.
         * Form login + CSRF are disabled for an API-oriented surface; HTTP Basic is enabled for tests.
         */
        @Bean
        @SuppressWarnings("unused")
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

