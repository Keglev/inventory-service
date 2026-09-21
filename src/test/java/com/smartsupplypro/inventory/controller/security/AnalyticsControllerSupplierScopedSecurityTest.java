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
    void should_return_401_when_item_update_frequency_is_requested_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/analytics/item-update-frequency")
                        .param("supplierId","S1"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void should_return_200_when_item_update_frequency_is_requested_authenticated() throws Exception {
        mockMvc.perform(get("/api/analytics/item-update-frequency")
                        .param("supplierId","S1")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }

    @Test
    void should_return_401_when_low_stock_items_are_requested_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/analytics/low-stock-items")
                        .param("supplierId","S1"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void should_return_200_when_low_stock_items_are_requested_authenticated() throws Exception {
        mockMvc.perform(get("/api/analytics/low-stock-items")
                        .param("supplierId","S1")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }
}
