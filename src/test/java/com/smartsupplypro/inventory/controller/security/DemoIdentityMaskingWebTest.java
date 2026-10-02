package com.smartsupplypro.inventory.controller.security;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import static org.springframework.security.config.Customizer.withDefaults;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.controller.EmployeeAnalyticsController;
import com.smartsupplypro.inventory.dto.EmployeeActivityDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import com.smartsupplypro.inventory.service.impl.analytics.EmployeeAnalyticsService;

/**
 * The masking runs in the real MVC pipeline: an anonymous demo caller receives
 * pseudonyms and cannot filter by a real address, while an admin sees real values.
 */
@WebMvcTest(controllers = EmployeeAnalyticsController.class)
@AutoConfigureMockMvc(addFilters = true)
@ActiveProfiles("test")
@Import(DemoIdentityMaskingWebTest.Support.class)
class DemoIdentityMaskingWebTest {

    // A reserved domain (RFC 2606) other than example.com, the exempt pseudonym domain
    private static final String REAL = "real.person@example.org";

    @Autowired MockMvc mockMvc;
    @Autowired AppProperties appProperties;
    @MockitoBean EmployeeAnalyticsService service;
    @MockitoBean AppUserRepository users;

    @BeforeEach
    void seed() {
        appProperties.setDemoReadonly(true);
        when(users.findAll()).thenReturn(List.of(new AppUser(REAL, "Real Person")));
        when(service.getEmployeeActivity(any(), any(), any(), any()))
                .thenReturn(List.of(new EmployeeActivityDTO("2026-09", REAL, "Real Person", 4)));
        when(service.getEmployeeChanges(any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(new StockUpdateResultDTO("Item", "Supplier", -2, "SOLD", REAL,
                        LocalDateTime.of(2026, 9, 1, 8, 0)))));
    }

    @AfterEach
    void resetDemoFlag() {
        appProperties.setDemoReadonly(false);
    }

    @Test
    void should_send_pseudonyms_to_an_anonymous_demo_caller() throws Exception {
        mockMvc.perform(get("/api/analytics/by-employee"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$[0].createdBy").value("demo-user-1@example.com"))
               .andExpect(jsonPath("$[0].displayName").value("Demo-Nutzer 1"));
        mockMvc.perform(get("/api/analytics/employee-changes"))
               .andExpect(jsonPath("$.content[0].createdBy").value("demo-user-1@example.com"));
    }

    @Test
    void should_send_real_identities_to_an_admin() throws Exception {
        mockMvc.perform(get("/api/analytics/by-employee").with(user("a").roles("ADMIN")))
               .andExpect(jsonPath("$[0].createdBy").value(REAL))
               .andExpect(jsonPath("$[0].displayName").value("Real Person"));
    }

    @Test
    void should_query_with_the_real_address_when_an_anonymous_caller_filters_by_a_pseudonym() throws Exception {
        mockMvc.perform(get("/api/analytics/employee-changes").param("createdBy", "demo-user-1@example.com"))
               .andExpect(status().isOk());

        verify(service).getEmployeeChanges(eq(REAL), any(), any(), any(), any());
    }

    @Test
    void should_match_nothing_when_an_anonymous_caller_filters_by_a_real_address() throws Exception {
        mockMvc.perform(get("/api/analytics/employee-changes").param("createdBy", REAL))
               .andExpect(status().isOk());

        verify(service).getEmployeeChanges(eq("no-match@example.invalid"), any(), any(), any(), any());
    }

    /** Mirrors the demo-enabled production chain: @PreAuthorize does the gating. */
    @TestConfiguration
    @EnableMethodSecurity
    static class Support {

        @Bean("appProperties")
        AppProperties appProperties() {
            return new AppProperties();
        }

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
