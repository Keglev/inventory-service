package com.smartsupplypro.inventory.controller.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security tests for supplier-scoped item lists:
 * <ul>
 *   <li>GET /api/analytics/item-update-frequency</li>
 *   <li>GET /api/analytics/low-stock-items</li>
 *
 * These endpoints should be accessible to authenticated users with the USER role,
 * and should return 401 Unauthorized for anonymous requests. 
 * </ul>
 */
@DisplayName("Analytics Security: Supplier-Scoped Lists")
class AnalyticsControllerSupplierScopedSecurityTest extends AbstractAnalyticsControllerSecurityTest {

    /** Tests the security of supplier-scoped analytics endpoints:
     * <ul>
     * <li>GET /api/analytics/item-update-frequency</li>
     * <li>GET /api/analytics/low-stock-items</li>
     * </ul>
     * 
     * These endpoints should be accessible to authenticated users with the USER role,
     * and should return 401 Unauthorized for anonymous requests.
     * @param Exception if the request fails
     **/
    @Test
    @DisplayName("GET /item-update-frequency → 401 for anonymous")
    void itemUpdateFrequency_unauthenticated_is401() throws Exception {
        mockMvc.perform(get("/api/analytics/item-update-frequency")
                        .param("supplierId","S1"))
               .andExpect(status().isUnauthorized());
    }

    /** Tests the security of supplier-scoped analytics endpoints:
     * <ul>
     * <li>GET /api/analytics/item-update-frequency</li>
     * <li>GET /api/analytics/low-stock-items</li>
     * </ul>
     * These endpoints should be accessible to authenticated users with the USER role,
     * 
     * and should return 200 OK for valid requests.
     * @param Exception if the request fails
     **/
    @Test
    @DisplayName("GET /item-update-frequency → 200 for USER")
    void itemUpdateFrequency_authenticatedUser_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/item-update-frequency")
                        .param("supplierId","S1")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }

    /** Tests the security of supplier-scoped analytics endpoints:
     * <ul>
     * <li>GET /api/analytics/low-stock-items</li>
     * </ul>
     * These endpoints should be accessible to authenticated users with the USER role,
     * and should return 401 Unauthorized for anonymous requests.
     * @param Exception if the request fails
     **/
    @Test
    @DisplayName("GET /low-stock-items → 401 for anonymous")
    void lowStockItems_unauthenticated_is401() throws Exception {
        mockMvc.perform(get("/api/analytics/low-stock-items")
                        .param("supplierId","S1"))
               .andExpect(status().isUnauthorized());
    }

    /** Tests the security of supplier-scoped analytics endpoints:
     * <ul>
     * <li>GET /api/analytics/low-stock-items</li>
     * 
     * </ul>
     * These endpoints should be accessible to authenticated users with the USER role,
     * and should return 200 OK for valid requests.
     * @param Exception if the request fails
     **/
    @Test
    @DisplayName("GET /low-stock-items → 200 for USER")
    void lowStockItems_authenticatedUser_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/low-stock-items")
                        .param("supplierId","S1")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }
}

