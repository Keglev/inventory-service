package com.smartsupplypro.inventory.controller.security;

import java.util.Collections;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import static org.springframework.security.config.Customizer.withDefaults;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.controller.EmployeeAnalyticsController;
import com.smartsupplypro.inventory.service.impl.analytics.EmployeeAnalyticsService;

/**
 * Access policy for the per-employee analytics endpoints:
 * ADMIN allowed; regular USER forbidden; anonymous allowed ONLY when the
 * read-only demo switch is on. The filter chain mirrors the production
 * demo-enabled configuration (GET reaches method security even for anonymous
 * callers), so the @PreAuthorize expression carries the gating.
 */
@WebMvcTest(
        controllers = EmployeeAnalyticsController.class,
        excludeAutoConfiguration = { OAuth2ResourceServerAutoConfiguration.class }
)
@AutoConfigureMockMvc(addFilters = true)
@ActiveProfiles("test")
@Import(EmployeeAnalyticsControllerSecurityTest.TestSupport.class)
class EmployeeAnalyticsControllerSecurityTest {

    @Autowired MockMvc mockMvc;
    @Autowired AppProperties appProperties;

    @AfterEach
    void resetDemoFlag() {
        appProperties.setDemoReadonly(false);
    }

    @Test
    void byEmployee_admin_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/by-employee").with(user("a").roles("ADMIN")))
               .andExpect(status().isOk());
    }

    @Test
    void byEmployee_regularUser_is403() throws Exception {
        mockMvc.perform(get("/api/analytics/by-employee").with(user("u").roles("USER")))
               .andExpect(status().isForbidden());
    }

    @Test
    void byEmployee_anonymous_withDemoReadonly_is200() throws Exception {
        appProperties.setDemoReadonly(true);
        mockMvc.perform(get("/api/analytics/by-employee"))
               .andExpect(status().isOk());
    }

    @Test
    void byEmployee_anonymous_withoutDemoReadonly_is403() throws Exception {
        mockMvc.perform(get("/api/analytics/by-employee"))
               .andExpect(status().isForbidden());
    }

    @Test
    void employeeChanges_admin_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/employee-changes").with(user("a").roles("ADMIN")))
               .andExpect(status().isOk());
    }

    @Test
    void employeeChanges_regularUser_is403() throws Exception {
        mockMvc.perform(get("/api/analytics/employee-changes").with(user("u").roles("USER")))
               .andExpect(status().isForbidden());
    }

    @TestConfiguration
    @EnableMethodSecurity
    static class TestSupport {

        @Bean
        EmployeeAnalyticsService employeeAnalyticsService() {
            EmployeeAnalyticsService mock = Mockito.mock(EmployeeAnalyticsService.class);
            when(mock.getEmployeeActivity(any(), any(), any())).thenReturn(Collections.emptyList());
            when(mock.getEmployeeChanges(any(), any(), any(), any())).thenReturn(Page.empty());
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
}
