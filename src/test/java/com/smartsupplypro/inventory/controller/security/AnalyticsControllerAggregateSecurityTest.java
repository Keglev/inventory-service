package com.smartsupplypro.inventory.controller.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security tests for aggregate analytics endpoints:
 * <ul>
 *   <li>GET /api/analytics/stock-value</li>
 *   <li>GET /api/analytics/stock-per-supplier</li>
 * </ul>
 */
@SuppressWarnings("unused")
@DisplayName("Analytics Security: Aggregates")
class AnalyticsControllerAggregateSecurityTest extends AbstractAnalyticsControllerSecurityTest {

    /**
     * Tests the security of aggregate analytics endpoints:
     * <ul>
     *  <li>GET /api/analytics/stock-value</li>
     * <li>GET /api/analytics/stock-per-supplier</li>
     * </ul>
     * These endpoints should be accessible to authenticated users with the USER role,
     * and should return 401 Unauthorized for anonymous requests.
     * 
     * @throws Exception if the request fails
     **/
    @Test
    @DisplayName("GET /stock-value → 401 for anonymous")
    void stockValue_unauthenticated_is401() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-value")
                        .param("start","2024-02-01")
                        .param("end","2024-02-28"))
               .andExpect(status().isUnauthorized());
    }

    /** Tests the security of aggregate analytics endpoints:
     * <ul>
     * <li>GET /api/analytics/stock-value</li>
     * 
     * <li>GET /api/analytics/stock-per-supplier</li>
     * </ul>
     * These endpoints should be accessible to authenticated users with the USER role,
     * and should return 200 OK for valid requests.
     * 
     * @param Exception if the request fails
     **/
    @Test
    @DisplayName("GET /stock-value → 200 for USER")
    void stockValue_authenticatedUser_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-value")
                        .param("start","2024-02-01")
                        .param("end","2024-02-28")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /stock-per-supplier → 401 for anonymous")
    void stockPerSupplier_unauthenticated_is401() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-per-supplier"))
               .andExpect(status().isUnauthorized());
    }

    /** Tests the security of aggregate analytics endpoints:
     * <ul>
     * 
     * <li>GET /api/analytics/stock-per-supplier</li>
     * </ul>
     * These endpoints should be accessible to authenticated users with the USER role,
     * and should return 200 OK for valid requests.
     * @param Exception if the request fails
     **/
    @Test
    @DisplayName("GET /stock-per-supplier → 200 for USER")
    void stockPerSupplier_authenticatedUser_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-per-supplier")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }

}

