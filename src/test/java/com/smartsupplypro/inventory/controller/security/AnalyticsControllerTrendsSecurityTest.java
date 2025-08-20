package com.smartsupplypro.inventory.controller.security;

import java.time.LocalDate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security tests for trend endpoints:
 * <ul>
 *   <li>GET /api/analytics/monthly-stock-movement</li>
 *   <li>GET /api/analytics/price-trend</li>
 * These endpoints should be accessible to authenticated users with the USER role,
 * and should return 401 Unauthorized for anonymous requests.
 * 
 * </ul>
 * These endpoints are used to analyze stock movement and price trends over time.
 * They should be secured to ensure only authenticated users can access them.
 * * <p>Tests include:</p>
 * <ul>
 *  <li>Unauthorized access for anonymous users</li>
 * <li>Authorized access for users with the USER AND ADMIN role</li>
 * </ul>
 */
@DisplayName("Analytics Security: Trends")
class AnalyticsControllerTrendsSecurityTest extends AbstractAnalyticsControllerSecurityTest {

    /** Tests the security of trend endpoints:
     * <ul>
     * <li>GET /api/analytics/monthly-stock-movement</li>
     * <li>GET /api/analytics/price-trend</li>
     * </ul>
     * These endpoints should be accessible to authenticated users with the USER role,
     * and should return 401 Unauthorized for anonymous requests.
     * @param Exception if the request fails
     **/
    @Test
    @DisplayName("GET /monthly-stock-movement → 401 for anonymous")
    void monthlyStockMovement_unauthenticated_is401() throws Exception {
        mockMvc.perform(get("/api/analytics/monthly-stock-movement")
                        .param("start","2024-02-01")
                        .param("end","2024-03-31"))
               .andExpect(status().isUnauthorized());
    }

    /** Tests the security of trend endpoints:
     * <ul>
     * <li>GET /api/analytics/monthly-stock-movement</li>
     * 
     * </ul>
     * These endpoints should be accessible to authenticated users with the USER role,
     * and should return 200 OK for valid requests.
     * @param Exception if the request fails
     **/
    @Test
    @DisplayName("GET /monthly-stock-movement → 200 for USER")
    void monthlyStockMovement_authenticatedUser_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/monthly-stock-movement")
                        .param("start","2024-02-01")
                        .param("end","2024-03-31")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }

    /** Tests the security of trend endpoints:
     * <ul>
     * 
     * <li>GET /api/analytics/price-trend</li>
     * </ul>
     * These endpoints should be accessible to authenticated users with the USER role,
     * and should return 401 Unauthorized for anonymous requests.
     * @param Exception if the request fails
     **/
    @Test
    @DisplayName("GET /price-trend → 401 for anonymous")
    void priceTrend_unauthenticated_is401() throws Exception {
        mockMvc.perform(get("/api/analytics/price-trend")
                        .param("itemId","I1")
                        .param("start", LocalDate.now().minusDays(7).toString())
                        .param("end", LocalDate.now().toString()))
               .andExpect(status().isUnauthorized());
    }

    /** Tests the security of trend endpoints:
     * <ul>
     * <li>GET /api/analytics/price-trend</li>
     * </ul>
     * These endpoints should be accessible to authenticated users with the USER role,
     * and should return 200 OK for valid requests.
     * 
     * @param Exception if the request fails
     **/
    @Test
    @DisplayName("GET /price-trend → 200 for USER")
    void priceTrend_authenticatedUser_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/price-trend")
                        .param("itemId","I1")
                        .param("start", LocalDate.now().minusDays(7).toString())
                        .param("end", LocalDate.now().toString())
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }
}

