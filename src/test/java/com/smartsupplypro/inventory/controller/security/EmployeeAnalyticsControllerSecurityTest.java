package com.smartsupplypro.inventory.controller.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.controller.EmployeeAnalyticsController;

/**
 * Access policy for the per-employee analytics endpoints:
 * ADMIN allowed; regular USER forbidden; anonymous allowed ONLY when the
 * read-only demo switch is on. The filter chain mirrors the production
 * demo-enabled configuration (GET reaches method security even for anonymous
 * callers), so the @PreAuthorize expression carries the gating.
 */
@WebMvcTest(
        controllers = EmployeeAnalyticsController.class
)
@AutoConfigureMockMvc(addFilters = true)
@ActiveProfiles("test")
@Import(EmployeeAnalyticsSecurityTestSupport.class)
class EmployeeAnalyticsControllerSecurityTest {

    @Autowired MockMvc mockMvc;
    @Autowired AppProperties appProperties;

    @AfterEach
    void resetDemoFlag() {
        appProperties.setDemoReadonly(false);
    }

    @Test
    void should_return_200_when_an_admin_requests_changes_by_employee() throws Exception {
        mockMvc.perform(get("/api/analytics/by-employee").with(user("a").roles("ADMIN")))
               .andExpect(status().isOk());
    }

    @Test
    void should_return_403_when_a_regular_user_requests_changes_by_employee() throws Exception {
        mockMvc.perform(get("/api/analytics/by-employee").with(user("u").roles("USER")))
               .andExpect(status().isForbidden());
    }

    @Test
    void should_return_200_when_an_anonymous_caller_requests_by_employee_in_demo_readonly() throws Exception {
        appProperties.setDemoReadonly(true);
        mockMvc.perform(get("/api/analytics/by-employee"))
               .andExpect(status().isOk());
    }

    @Test
    void should_return_403_when_an_anonymous_caller_requests_by_employee_outside_demo_readonly() throws Exception {
        mockMvc.perform(get("/api/analytics/by-employee"))
               .andExpect(status().isForbidden());
    }

    @Test
    void should_return_200_when_an_admin_requests_employee_changes() throws Exception {
        mockMvc.perform(get("/api/analytics/employee-changes").with(user("a").roles("ADMIN")))
               .andExpect(status().isOk());
    }

    @Test
    void should_return_403_when_a_regular_user_requests_employee_changes() throws Exception {
        mockMvc.perform(get("/api/analytics/employee-changes").with(user("u").roles("USER")))
               .andExpect(status().isForbidden());
    }

}
