package com.smartsupplypro.inventory.controller.security;

import java.util.Collections;
import org.mockito.Mockito;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.data.domain.Page;
import static org.springframework.security.config.Customizer.withDefaults;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.service.impl.analytics.EmployeeAnalyticsService;

@TestConfiguration
@EnableMethodSecurity
class EmployeeAnalyticsSecurityTestSupport {

    @Bean
    EmployeeAnalyticsService employeeAnalyticsService() {
        EmployeeAnalyticsService mock = Mockito.mock(EmployeeAnalyticsService.class);
        when(mock.getEmployeeActivity(any(), any(), any(), any())).thenReturn(Collections.emptyList());
        when(mock.getEmployeeChanges(any(), any(), any(), any(), any())).thenReturn(Page.empty());
        return mock;
    }

    @Bean("appProperties")
    AppProperties appProperties() {
        return new AppProperties();
    }

    // Mirrors the prod chain when demo mode is enabled: GET requests reach the
    // controller for anonymous callers; @PreAuthorize performs the gating.
    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .httpBasic(withDefaults())
            .formLogin(form -> form.disable());
        return http.build();
    }
}
