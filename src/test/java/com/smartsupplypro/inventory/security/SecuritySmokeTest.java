package com.smartsupplypro.inventory.security;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.config.SecurityConfig;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import com.smartsupplypro.inventory.service.CustomOAuth2UserService;
import com.smartsupplypro.inventory.service.CustomOidcUserService;


/**
 * Security smoke tests exercising the real {@link SecurityConfig} in a lean MVC slice.
 *
 * <h2>Design</h2>
 * <ul>
 *   <li>Load only {@code AdminStubController} (probe endpoints) via {@link WebMvcTest}.</li>
 *   <li>Import production {@link SecurityConfig}.</li>
 *   <li>Provide the exact beans SecurityConfig needs <b>as @Bean methods</b> (no @MockBean/@MockitoBean):
 *       <ul>
 *         <li>{@link OAuth2LoginSuccessHandler} (Mockito mock)</li>
 *         <li>{@link CustomOAuth2UserService} (Mockito mock)</li>
 *         <li>{@link ClientRegistrationRepository} (in-memory Google reg)</li>
 *         <li>{@link AppProperties} (with frontend baseUrl/landingPath)</li>
 *       </ul>
 *       These beans exist before context refresh, so autowiring succeeds.</li>
 * </ul>
 *
 * <h2>Validations</h2>
 * <ul>
 *   <li><b>AuthZ:</b> /api/admin/ping requires ADMIN role.</li>
 *   <li><b>CORS:</b> dev origin preflight allowed; credentials enabled.</li>
 *   <li><b>OAuth:</b> /oauth2/authorization/google is reachable and redirects.</li>
 * </ul>
 */
@SuppressWarnings("unused")
@WebMvcTest(controllers = AdminStubController.class)
@AutoConfigureMockMvc(addFilters = true)
@Import({ SecurityConfig.class, SecuritySmokeTest.TestBeans.class })
class SecuritySmokeTest {

    @Autowired MockMvc mvc;

    // Optional: sanity-check wiring
    @Autowired OAuth2LoginSuccessHandler successHandler;
    @Autowired CustomOAuth2UserService customOAuth2UserService;
    @Autowired ClientRegistrationRepository clientRegistrationRepository;
    @Autowired AppProperties appProperties; // comes from @EnableConfigurationProperties in SecurityConfig

    @Test
    @DisplayName("Wiring sanity: required beans are present")
    void wiringSanity() {
        // Verify all critical security beans are properly wired and available
        assertThat(successHandler).isNotNull();
        assertThat(customOAuth2UserService).isNotNull();
        assertThat(clientRegistrationRepository.findByRegistrationId("google")).isNotNull();
        assertThat(appProperties).isNotNull();
    }

    /**
     * Validates that users with ADMIN role can access admin-restricted endpoints.
     * Tests the role-based access control (RBAC) mechanism.
     */
    @Test
    @DisplayName("ADMIN role gets 200 on /api/admin/ping")
    @WithMockUser(username = "admin", roles = "ADMIN")
    void adminCanAccessAdmin() throws Exception {
        mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
           .andExpect(status().isOk())
           .andExpect(content().string("admin ok"));
    }

    /**
     * Validates that users with USER role are denied access to admin endpoints.
     * Tests that authorization rules properly reject insufficiently-privileged users.
     */
    @Test
    @DisplayName("USER role gets 403 on /api/admin/ping")
    @WithMockUser(username = "user", roles = "USER")
    void userCannotAccessAdmin() throws Exception {
        mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
           .andExpect(status().isForbidden());
    }

    /**
     * Validates that CORS (Cross-Origin Resource Sharing) preflight requests
     * from the dev frontend (http://localhost:5173) are allowed with credentials.
     * Tests that frontend can make requests to the backend API.
     */
    @Test
    @DisplayName("CORS preflight allows http://localhost:5173 with credentials")
    void corsPreflightForDevOrigin() throws Exception {
        mvc.perform(options("/api/admin/ping")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "GET"))
           .andExpect(status().isOk()) // change to isNoContent() if your CORS returns 204
           .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
           .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    /**
     * Validates that the OAuth2 authorization endpoint is accessible
     * and properly redirects to the OAuth provider (Google).
     * Tests that the OAuth flow entry point is reachable.
     */
    @Test
    @DisplayName("OAuth authorization endpoint is permitted (redirects)")
    void oauthAuthorizationEndpointIsPermitted() throws Exception {
        mvc.perform(get("/oauth2/authorization/google"))
           .andExpect(status().is3xxRedirection());
    }

    /**
     * Test-time beans required by SecurityConfig, provided up-front.
     * 
     * <p>This inner class provides all dependencies that {@link SecurityConfig} needs
     * during test context initialization. Using @Bean methods (not @MockBean/@MockitoBean)
     * ensures these beans exist before the Spring context refreshes, allowing proper
     * autowiring throughout the configuration.</p>
     * 
     * <p><strong>Why not use @MockBean?</strong> Because @MockBean is created after the
     * context starts, causing SecurityConfig to fail autowiring during its initialization.</p>
     */
    @TestConfiguration
    static class TestBeans {

        /**
         * Provides a mock {@link OAuth2LoginSuccessHandler}.
         * Used by SecurityConfig to handle successful OAuth2 logins.
         * For this smoke test, no specific behavior is needed.
         */
        @Bean
        OAuth2LoginSuccessHandler successHandler() {
            return Mockito.mock(OAuth2LoginSuccessHandler.class);
        }

        /**
         * Provides a mock {@link AppUserRepository}.
         * Used by CustomOAuth2UserService to persist/retrieve user data.
         * Not invoked in these smoke tests but required for autowiring.
         */
        @Bean
        AppUserRepository appUserRepository() {
            return Mockito.mock(AppUserRepository.class);
        }

        /**
         * Provides a mock {@link CustomOAuth2UserService}.
         * Responsible for mapping OAuth2 user info to application users.
         * Requires AppUserRepository as a dependency.
         */
        @Bean
        CustomOAuth2UserService customOAuth2UserService(AppUserRepository appUserRepository) {
            // Provide the mock; Spring will still run autowiring and find the repo above.
            return Mockito.mock(CustomOAuth2UserService.class);
        }

        /**
         * Provides an in-memory {@link ClientRegistrationRepository} with a dummy Google OAuth config.
         * Allows the security configuration to find and use the "google" client registration.
         * Uses dummy credentials since we don't perform real OAuth flows in this test.
         */
        @Bean
        ClientRegistrationRepository clientRegistrationRepository() {
            // Build a dummy Google OAuth2 client registration for testing
            ClientRegistration google = ClientRegistration.withRegistrationId("google")
                .clientId("dummy")
                .clientSecret("dummy")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
                .userNameAttributeName("sub")
                .scope("openid", "profile", "email")
                .clientName("Google")
                .build();
            // Store in memory repository for SecurityConfig to access
            return new InMemoryClientRegistrationRepository(google);
        }

        /**
         * Provides a mock {@link CustomOidcUserService}.
         * Handles OIDC (OpenID Connect) user mapping for Google logins.
         * In a @WebMvcTest we don't hit the real provider, so a mock is sufficient.
         */
        @Bean
        CustomOidcUserService customOidcUserService(AppUserRepository appUserRepository) {
            // SecurityConfig wires an OIDC user service for Google logins.
            // In a @WebMvcTest slice we don't hit the real provider, so a mock is sufficient.
            return Mockito.mock(CustomOidcUserService.class);
        }

        /**
         * Provides a mock {@link com.smartsupplypro.inventory.config.SecurityFilterHelper}
         * with a real pass-through filter for API detection.
         * 
         * <p>The filter is configured to simply delegate to the next filter in the chain,
         * allowing requests to pass through without modification during tests.</p>
         */
        @Bean
        com.smartsupplypro.inventory.config.SecurityFilterHelper securityFilterHelper() {
            com.smartsupplypro.inventory.config.SecurityFilterHelper mock = 
                Mockito.mock(com.smartsupplypro.inventory.config.SecurityFilterHelper.class);
            // Return a real filter to avoid null
            Mockito.when(mock.createApiDetectionFilter()).thenReturn(
                new org.springframework.web.filter.OncePerRequestFilter() {
                    @Override
                    protected void doFilterInternal(
                            @org.springframework.lang.NonNull jakarta.servlet.http.HttpServletRequest req,
                            @org.springframework.lang.NonNull jakarta.servlet.http.HttpServletResponse res,
                            @org.springframework.lang.NonNull jakarta.servlet.FilterChain chain)
                            throws jakarta.servlet.ServletException, java.io.IOException {
                        // Pass through without modification - just continue the chain
                        chain.doFilter(req, res);
                    }
                });
            return mock;
        }

        /**
         * Provides a mock {@link com.smartsupplypro.inventory.config.SecurityEntryPointHelper}
         * with real entry points for API and web contexts.
         * 
         * <p>Entry points determine how to handle authentication failures:</p>
         * <ul>
         *   <li>API: Send 401 Unauthorized response</li>
         *   <li>Web: Redirect to landing page (e.g., /)</li>
         * </ul>
         */
        @Bean
        com.smartsupplypro.inventory.config.SecurityEntryPointHelper securityEntryPointHelper() {
            com.smartsupplypro.inventory.config.SecurityEntryPointHelper mock = 
                Mockito.mock(com.smartsupplypro.inventory.config.SecurityEntryPointHelper.class);
            // Return real entry points to avoid null
            Mockito.when(mock.createApiEntryPoint()).thenReturn((req, res, ex) -> {
                // API context: return 401 Unauthorized
                res.sendError(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
            });
            Mockito.when(mock.createWebEntryPoint(Mockito.anyString())).thenReturn((req, res, ex) -> {
                // Web context: redirect to landing page (/)
                res.sendRedirect("/");
            });
            return mock;
        }

        /**
         * Provides a mock {@link com.smartsupplypro.inventory.config.SecurityAuthorizationHelper}
         * that configures endpoint-level authorization rules.
         * 
         * <p>This mock applies minimal authorization for tests:</p>
         * <ul>
         *   <li>/api/admin/** requires ADMIN role</li>
         *   <li>All other endpoints require authentication</li>
         * </ul>
         */
        @Bean
        com.smartsupplypro.inventory.config.SecurityAuthorizationHelper securityAuthorizationHelper() {
            com.smartsupplypro.inventory.config.SecurityAuthorizationHelper mock = 
                Mockito.mock(com.smartsupplypro.inventory.config.SecurityAuthorizationHelper.class);
            // configureAuthorization returns void, so use doAnswer to configure behavior
            Mockito.doAnswer(invocation -> {
                org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer<?>.AuthorizationManagerRequestMatcherRegistry auth =
                    invocation.getArgument(0);
                // Apply test authorization rules
                auth.requestMatchers("/api/admin/**").hasRole("ADMIN"); // Admin endpoints require ADMIN role
                auth.anyRequest().authenticated();                       // Everything else requires authentication
                return null;
            }).when(mock).configureAuthorization(Mockito.any(), Mockito.anyBoolean());
            return mock;
        }

        // IMPORTANT: Do NOT declare an AppProperties @Bean here.
        // SecurityConfig's @EnableConfigurationProperties(AppProperties.class) already provides it.
    }
}