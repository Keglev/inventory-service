package com.smartsupplypro.inventory.controller.security;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security tests for {@link com.smartsupplypro.inventory.controller.StockAnalyticsController}
 * trend endpoints (monthly-stock-movement, price-trend) ensuring 401 for anonymous and 200 for USER.
 */
@SuppressWarnings("unused")
class AnalyticsControllerTrendsSecurityTest extends AbstractAnalyticsControllerSecurityTest {

    @Test
    void monthlyStockMovement_unauthenticated_is401() throws Exception {
        mockMvc.perform(get("/api/analytics/monthly-stock-movement")
                        .param("start","2024-02-01")
                        .param("end","2024-03-31"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void monthlyStockMovement_authenticatedUser_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/monthly-stock-movement")
                        .param("start","2024-02-01")
                        .param("end","2024-03-31")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }

    @Test
    void priceTrend_unauthenticated_is401() throws Exception {
        mockMvc.perform(get("/api/analytics/price-trend")
                        .param("itemId","I1")
                        .param("start", LocalDate.now().minusDays(7).toString())
                        .param("end", LocalDate.now().toString()))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void priceTrend_authenticatedUser_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/price-trend")
                        .param("itemId","I1")
                        .param("start", LocalDate.now().minusDays(7).toString())
                        .param("end", LocalDate.now().toString())
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }
}
