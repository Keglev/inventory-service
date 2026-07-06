package com.smartsupplypro.inventory.controller.security;

import org.junit.jupiter.api.Test;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security contract for the reason-breakdown analytics endpoint: authenticated
 * users may read; anonymous requests are challenged by the filter chain.
 */
class StockReasonAnalyticsControllerSecurityTest extends AbstractAnalyticsControllerSecurityTest {

    @Test
    void reasonBreakdownGET_unauthenticated_is401() throws Exception {
        mockMvc.perform(get("/api/analytics/reason-breakdown"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void reasonBreakdownGET_authenticatedUser_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/reason-breakdown")
                        .param("startDate", "2026-01-01")
                        .param("endDate", "2026-06-30")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }
}
