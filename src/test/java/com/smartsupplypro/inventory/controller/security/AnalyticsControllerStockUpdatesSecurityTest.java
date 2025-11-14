package com.smartsupplypro.inventory.controller.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


/**
 * Security tests for the AnalyticsController's stock updates endpoints.
 * Tests ensure that only authenticated users with the USER role can access the endpoints.
 * Unauthorized access attempts return 401 status code.
 * Authenticated access by users with the USER role returns 200 status code.
 * This class extends AbstractAnalyticsControllerSecurityTest to inherit common security test setup.
 * 
 */
@SuppressWarnings("unused")
@DisplayName("Analytics Security: Stock Updates")
class AnalyticsControllerStockUpdatesSecurityTest extends AbstractAnalyticsControllerSecurityTest {

    /**
     * Tests for the stock updates endpoints in the AnalyticsController.
     * These tests verify that:
     * 1. Anonymous users receive a 401 Unauthorized status when accessing the endpoints.
     * 2. Authenticated users with the USER role receive a 200 OK status when accessing the endpoints.
     * * The tests cover both GET and POST requests for the stock updates endpoints.
     * * The tests use MockMvc to simulate HTTP requests and verify the responses.
     * * The tests are annotated with @DisplayName for better readability in test reports.
     * * This class is specifically focused on security aspects of the stock updates endpoints.
     * * @see AbstractAnalyticsControllerSecurityTest
    **/
    @Test
    @DisplayName("GET /stock-updates → 401 for anonymous")
    void stockUpdatesGET_unauthenticated_is401() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-updates"))
               .andExpect(status().isUnauthorized());
    }

    /**
     * Tests that authenticated users with the USER role can access the stock updates endpoint.
     * @throws Exception
     */
    @Test
    @DisplayName("GET /stock-updates → 200 for USER")
    void stockUpdatesGET_authenticatedUser_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/stock-updates")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }

    /**
     * Tests that anonymous users receive a 401 Unauthorized status when attempting to post to the stock updates endpoint.
     * @throws Exception
     * This test ensures that the security configuration correctly restricts access to authenticated users.
     **/
    @Test
    @DisplayName("POST /stock-updates/query → 401 for anonymous")
    void stockUpdatesPOST_unauthenticated_is401() throws Exception {
        mockMvc.perform(post("/api/analytics/stock-updates/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"itemName\":\"x\"}"))
               .andExpect(status().isUnauthorized());
    }
    /**
     * Tests that authenticated users with the USER role can successfully post to the stock updates endpoint.
     * @throws Exception
     * This test verifies that the security configuration allows access to the endpoint for users with the appropriate role.
     * * It simulates a POST request with a JSON body and checks for a 200 OK response.
     **/
    @Test
    @DisplayName("POST /stock-updates/query → 200 for USER")
    void stockUpdatesPOST_authenticatedUser_is200() throws Exception {
        mockMvc.perform(post("/api/analytics/stock-updates/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"itemName\":\"x\"}")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }
}

