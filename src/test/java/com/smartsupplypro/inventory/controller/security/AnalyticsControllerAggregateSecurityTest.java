package com.smartsupplypro.inventory.controller.security;

import org.junit.jupiter.api.Test;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security tests for {@link com.smartsupplypro.inventory.controller.StockAnalyticsController}
 * aggregate endpoints (stock-value, stock-per-supplier) ensuring 401 for anonymous and 200 for USER.
 */
class AnalyticsControllerAggregateSecurityTest extends AbstractAnalyticsControllerSecurityTest {

    @Test
    void stockValue_unauthenticated_is401() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-value")
                        .param("start","2024-02-01")
                        .param("end","2024-02-28"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void stockValue_authenticatedUser_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-value")
                        .param("start","2024-02-01")
                        .param("end","2024-02-28")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }

    @Test
    void stockPerSupplier_unauthenticated_is401() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-per-supplier"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void stockPerSupplier_authenticatedUser_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-per-supplier")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }
}
