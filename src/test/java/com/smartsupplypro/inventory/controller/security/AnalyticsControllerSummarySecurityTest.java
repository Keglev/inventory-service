package com.smartsupplypro.inventory.controller.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security tests for summary endpoints:
 * <ul>
 *   <li>GET /api/analytics/summary</li>
 *   <li>GET /api/analytics/financial/summary</li>
 * * These tests ensure that:
 * *   <li>Anonymous users receive a 401 Unauthorized status when accessing the endpoints.</li>
 * *   <li>Authenticated users with the USER role receive a 200 OK status when accessing the endpoints.</li>
 * 
 * </ul>
 */
@DisplayName("Analytics Security: Summaries")
class AnalyticsControllerSummarySecurityTest extends AbstractAnalyticsControllerSecurityTest {

    /**
     * Tests for the summary endpoints in the AnalyticsController.
     * These tests verify that:
     * 1. Anonymous users receive a 401 Unauthorized status when accessing the endpoints.
     * 2. Authenticated users with the USER role receive a 200 OK status when accessing the endpoints.
     * * The tests cover both GET requests for the summary endpoints.
     * * The tests use MockMvc to simulate HTTP requests and verify the responses.
     * * The tests are annotated with @DisplayName for better readability in test reports.
     * * This class is specifically focused on security aspects of the summary endpoints.
     **/ 
    @Test
    @DisplayName("GET /summary → 401 for anonymous")
    void summary_unauthenticated_is401() throws Exception {
        mockMvc.perform(get("/api/analytics/summary"))
               .andExpect(status().isUnauthorized());
    }

    /**
     * 
     * 
     * Tests that authenticated users with the USER role can access the summary endpoint.
     * * @throws Exception
     **/
    @Test
    @DisplayName("GET /summary → 200 for USER")
    void summary_authenticatedUser_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/summary")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }

    /**
     * Tests that anonymous users receive a 401 Unauthorized status when attempting to access the financial summary endpoint.
     * * @throws Exception
     * This test ensures that the security configuration correctly restricts access to authenticated users.
     **/
    @Test
    @DisplayName("GET /financial/summary → 401 for anonymous")
    void financialSummary_unauthenticated_is401() throws Exception {
        mockMvc.perform(get("/api/analytics/financial/summary")
                        .param("from","2024-02-01")
                        .param("to","2024-02-28"))
               .andExpect(status().isUnauthorized());
    }

    /**
     * Tests that authenticated users with the USER role can access the financial summary endpoint.
     * * @throws Exception
     * This test verifies that the security configuration allows access to the endpoint for users with the appropriate role.
     * * It simulates a GET request with date parameters and checks for a 200 OK response.
     **/
    @Test
    @DisplayName("GET /financial/summary → 200 for USER")
    void financialSummary_authenticatedUser_is200() throws Exception {
        mockMvc.perform(get("/api/analytics/financial/summary")
                        .param("from","2024-02-01")
                        .param("to","2024-02-28")
                        .with(user("u").roles(USER)))
               .andExpect(status().isOk());
    }
}

