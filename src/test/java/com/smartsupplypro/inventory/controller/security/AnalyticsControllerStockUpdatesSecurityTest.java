package com.smartsupplypro.inventory.controller.security;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security tests for {@link com.smartsupplypro.inventory.controller.StockUpdateAnalyticsController}
 * stock-updates endpoints (GET and POST) ensuring 401 for anonymous and 200 for USER.
 */
class AnalyticsControllerStockUpdatesSecurityTest extends AbstractAnalyticsControllerSecurityTest {

    @Test
    void should_return_401_when_stock_updates_are_fetched_by_get_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-updates"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void should_return_200_when_stock_updates_are_fetched_by_get_authenticated() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-updates")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }

    @Test
    void should_return_401_when_stock_updates_are_posted_unauthenticated() throws Exception {
        mockMvc.perform(post("/api/analytics/stock-updates/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"itemName\":\"x\"}"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void should_return_200_when_stock_updates_are_posted_authenticated() throws Exception {
        mockMvc.perform(post("/api/analytics/stock-updates/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"itemName\":\"x\"}")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }
}
