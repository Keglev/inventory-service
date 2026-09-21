package com.smartsupplypro.inventory.controller.security;

import org.junit.jupiter.api.Test;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security tests for {@link com.smartsupplypro.inventory.controller.AnalyticsController}
 * summary endpoints (dashboard summary, financial summary) ensuring 401 for anonymous and 200 for USER.
 */
class AnalyticsControllerSummarySecurityTest extends AbstractAnalyticsControllerSecurityTest {

    @Test
    void should_return_401_when_the_summary_is_requested_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/analytics/summary"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void should_return_200_when_the_summary_is_requested_authenticated() throws Exception {
        mockMvc.perform(get("/api/analytics/summary")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }

    @Test
    void should_return_401_when_the_financial_summary_is_requested_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/analytics/financial/summary")
                        .param("from","2024-02-01")
                        .param("to","2024-02-28"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void should_return_200_when_the_financial_summary_is_requested_authenticated() throws Exception {
        mockMvc.perform(get("/api/analytics/financial/summary")
                        .param("from","2024-02-01")
                        .param("to","2024-02-28")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }
}
