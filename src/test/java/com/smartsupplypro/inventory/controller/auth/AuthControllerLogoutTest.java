package com.smartsupplypro.inventory.controller.auth;

import static java.util.Collections.singletonList;
import java.util.List;
import java.util.Map;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath; // used in unauth check (optional)
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.AuthController;
import com.smartsupplypro.inventory.repository.AppUserRepository;

import jakarta.annotation.Resource;

/**
 * Comprehensive test suite for AuthController logout functionality validating
 * session management and security context cleanup in the Smart Supply Pro system.
 * 
 * <p><strong>ENTERPRISE BUSINESS CONTEXT:</strong> Secure logout is critical for inventory
 * management systems where users access sensitive supplier data, financial information,
 * and business intelligence. Proper session invalidation prevents unauthorized access
 * to inventory operations after user logout.</p>
 * 
 * <p><strong>TECHNICAL SCOPE:</strong> Tests POST /api/auth/logout endpoint for proper
 * session cookie expiration (JSESSIONID, SESSION), security attributes validation,
 * and unauthorized access prevention. Validates Spring Security context cleanup.</p>
 * 
 * <p><strong>SECURITY TESTING:</strong> Ensures complete session invalidation with proper
 * cookie security attributes (HttpOnly, Secure, SameSite=None) and prevents session
 * hijacking in enterprise inventory management workflows.</p>
 * 
 * <p><strong>TEST ARCHITECTURE:</strong> Uses Spring Security test support with OAuth2
 * authentication simulation and MockMvc for HTTP layer session management validation.</p>
 */
@SuppressWarnings("unused")
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = true)
@Import(TestSecurityConfig.class)
class AuthControllerLogoutTest {

    @Resource
    private MockMvc mockMvc;

    // Not directly used by /auth/logout, but present so the slice can instantiate the controller
    @SuppressWarnings("unused")
    @MockitoBean
    private AppUserRepository appUserRepository;

    /**
     * Creates OAuth2AuthenticationToken for logout testing scenarios.
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Simulates authenticated user sessions
     * for logout testing, enabling validation of session cleanup across different
     * user roles and authentication states in inventory management workflows.</p>
     *
     * @param email the user email for OAuth2 token simulation
     * @param role the user role (ADMIN/USER) for authorization context testing
     * @return OAuth2AuthenticationToken for logout session testing
     */
    private OAuth2AuthenticationToken authToken(String email, String role) {
        // ENTERPRISE: Create realistic OAuth2 token for logout session testing
        OAuth2User principal = new DefaultOAuth2User(
                singletonList(() -> "ROLE_" + role),
                Map.of("email", email),
                "email"
        );
        return new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");
    }

    /**
     * Validates complete session invalidation and secure cookie cleanup during logout.
     * 
     * <p><strong>GIVEN:</strong> Authenticated user with valid OAuth2 session</p>
     * <p><strong>WHEN:</strong> POST /api/auth/logout is called by authenticated user</p>
     * <p><strong>THEN:</strong> Session cookies are expired with proper security attributes</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Critical for inventory system security where
     * users handle sensitive supplier contracts, pricing data, and business analytics.
     * Proper logout prevents unauthorized access to inventory operations and financial data.</p>
     */
    @Test
    @DisplayName("POST /api/auth/logout → 204 and expires SESSION/JSESSIONID cookies")
    void logout_authenticated_returns204_andExpiresCookies() throws Exception {
        // GIVEN: Authenticated user with active session
        // WHEN: Logout request is made by authenticated user
        var result = mockMvc.perform(post("/api/auth/logout")
                        .with(authentication(authToken("user@example.com", "USER")))
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                        .accept(MediaType.APPLICATION_JSON))
                // THEN: Logout succeeds with no content response
                .andExpect(status().isNoContent())
                .andReturn();

        // ENTERPRISE: Validate complete session cleanup with security attributes
        List<String> setCookies = result.getResponse().getHeaders("Set-Cookie");
        // We should have at least two Set-Cookie headers for session invalidation
        assertThat("Expected Set-Cookie headers", setCookies, is(not(empty())));

        // ENTERPRISE: Verify both JSESSIONID and SESSION cookies are invalidated
        assertThat(setCookies, hasItem(containsString("JSESSIONID=")));
        assertThat(setCookies, hasItem(containsString("SESSION=")));

        // ENTERPRISE: Validate security attributes prevent session hijacking
        for (String c : setCookies) {
            assertThat(c, containsString("Max-Age=0")); // Cookie expiration
            assertThat(c, containsString("Path=/"));     // Application scope
            assertThat(c, anyOf(containsString("HttpOnly"), containsString("httponly"))); // XSS protection
            assertThat(c, containsString("SameSite=None")); // Cross-site protection
            assertThat(c, containsString("Secure"));        // HTTPS-only transmission
        }
    }

    /**
     * Validates proper rejection of unauthenticated logout attempts.
     * 
     * <p><strong>GIVEN:</strong> No authentication context (anonymous request)</p>
     * <p><strong>WHEN:</strong> POST /api/auth/logout is called without authentication</p>
     * <p><strong>THEN:</strong> 401 Unauthorized is returned with JSON error response</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Prevents potential DoS attacks through
     * logout endpoint abuse and ensures consistent API error responses. Protects
     * against session management vulnerabilities in inventory system access controls.</p>
     */
    @Test
    @DisplayName("POST /api/auth/logout unauthenticated → 401 JSON from API entry point")
    void logout_unauthenticated_returns401Json() throws Exception {
        // GIVEN: No authentication context provided (anonymous request)
        // WHEN: Logout attempt is made without authentication
        mockMvc.perform(post("/api/auth/logout").accept(MediaType.APPLICATION_JSON))
                // THEN: Request is rejected with unauthorized status and JSON error
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value("Unauthorized"));
    }
}

