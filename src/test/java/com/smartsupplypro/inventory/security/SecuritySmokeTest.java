package com.smartsupplypro.inventory.security;

import com.smartsupplypro.inventory.config.SecurityConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Security smoke tests that exercise the real {@link SecurityConfig} using a minimal controller.
 *
 * <p><strong>Scope</strong></p>
 * <ul>
 *   <li>Loads only {@link AdminStubController} via {@code @WebMvcTest} to keep the slice small.</li>
 *   <li>Imports the production security chain via {@link SecurityConfig}.</li>
 *   <li>Provides dummy OAuth client properties so the authorization endpoint is routable.</li>
 *   <li>Mocks {@code OAuth2LoginSuccessHandler} to avoid pulling repositories/JPA.</li>
 * </ul>
 *
 * <p><strong>What we validate</strong></p>
 * <ul>
 *   <li><em>Authorization:</em> ADMIN can access <code>/api/admin/ping</code>; USER is forbidden.</li>
 *   <li><em>Unauthenticated behavior:</em> JSON APIs return 401 with a JSON payload (covered elsewhere).</li>
 *   <li><em>CORS:</em> Preflight accepts dev origin and allows credentials.</li>
 *   <li><em>OAuth flow:</em> <code>/oauth2/authorization/google</code> is publicly accessible and redirects.</li>
 * </ul>
 *
 * @since 2025-08
 * @see SecurityConfig
 */
@WebMvcTest(controllers = AdminStubController.class)      // Load only the stub controller
@AutoConfigureMockMvc(addFilters = true)                  // Keep Spring Security filters active
@Import(SecurityConfig.class)                             // Use the real security configuration
@TestPropertySource(properties = {
    // Provide a dummy client so /oauth2/authorization/google resolves without NPEs
    "spring.security.oauth2.client.registration.google.client-id=dummy",
    "spring.security.oauth2.client.registration.google.client-secret=dummy"
})
class SecuritySmokeTest {

    @Autowired
    MockMvc mvc;

    /**
     * SecurityConfig depends on this bean; mock to avoid data-layer wiring in a web slice.
     */
    @MockitoBean
    OAuth2LoginSuccessHandler successHandler;

    /**
     * Verifies that a caller with {@code ADMIN} authority can access the admin probe.
     *
     * <p><strong>Given</strong> a mock user authenticated with {@code ADMIN} authority<br>
     * <strong>When</strong> GET {@code /api/admin/ping} is invoked<br>
     * <strong>Then</strong> the response is 200 OK and the body equals {@code "admin ok"}.</p>
     *
     * @throws Exception if the request fails
     */
    @Test
    @DisplayName("ADMIN authority gets 200 on /api/admin/ping")
    @WithMockUser(username = "admin", authorities = "ADMIN")
    void adminCanAccessAdmin() throws Exception {
        mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
           .andExpect(status().isOk())
           .andExpect(content().string("admin ok"));
    }

    /**
     * Verifies that a caller with {@code USER} authority is forbidden from the admin probe.
     *
     * <p><strong>Given</strong> a mock user authenticated with {@code USER} authority<br>
     * <strong>When</strong> GET {@code /api/admin/ping} is invoked<br>
     * <strong>Then</strong> the response is 403 Forbidden.</p>
     *
     * @throws Exception if the request fails
     */
    @Test
    @DisplayName("USER role gets 403 on /api/admin/ping")
    @WithMockUser(username = "user", authorities = "USER")
    void userCannotAccessAdmin() throws Exception {
        mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
           .andExpect(status().isForbidden());
    }

    /**
     * Ensures CORS preflight accepts the dev origin and allows credentials (cookies).
     *
     * <p><strong>Given</strong> an OPTIONS preflight from {@code http://localhost:5173}<br>
     * <strong>When</strong> requesting method {@code GET} for {@code /api/admin/ping}<br>
     * <strong>Then</strong> CORS responds 200 with {@code Access-Control-Allow-Origin} set to the
     * origin and {@code Access-Control-Allow-Credentials:true}.</p>
     *
     * @throws Exception if the request fails
     */
    @Test
    @DisplayName("CORS preflight allows http://localhost:5173 with credentials")
    void corsPreflightForDevOrigin() throws Exception {
        mvc.perform(options("/api/admin/ping")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "GET"))
           .andExpect(status().isOk())
           .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
           .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    /**
     * Confirms the OAuth authorization endpoint is publicly accessible and triggers a redirect.
     *
     * <p><strong>Given</strong> no authentication<br>
     * <strong>When</strong> GET {@code /oauth2/authorization/google} is invoked<br>
     * <strong>Then</strong> the response is a 3xx redirect (exact target depends on client config).</p>
     *
     * @throws Exception if the request fails
     */
    @Test
    @DisplayName("OAuth authorization endpoint is permitted (redirects)")
    void oauthAuthorizationEndpointIsPermitted() throws Exception {
        mvc.perform(get("/oauth2/authorization/google"))
           .andExpect(status().is3xxRedirection());
    }
}
