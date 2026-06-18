package com.smartsupplypro.inventory.controller.security;

import org.junit.jupiter.api.Test;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security tests for {@link com.smartsupplypro.inventory.controller.StockAnalyticsController}
 * supplier-scoped endpoints (item-update-frequency, low-stock-items) ensuring 401 for anonymous and 200 for USER.
 */
class AnalyticsControllerSupplierScopedSecurityTest extends AbstractAnalyticsControllerSecurityTest {

    @Test
    void itemUpdateFrequency_unauthenticated_is401() throws Exception {
        mockMvc.perform(get("/api/analytics/item-update-frequency")
                        .param("supplierId","S1"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void itemUpdateFrequency_authenticatedUser_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/item-update-frequency")
                        .param("supplierId","S1")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }

    @Test
    void lowStockItems_unauthenticated_is401() throws Exception {
        mockMvc.perform(get("/api/analytics/low-stock-items")
                        .param("supplierId","S1"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void lowStockItems_authenticatedUser_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/low-stock-items")
                        .param("supplierId","S1")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }
}
