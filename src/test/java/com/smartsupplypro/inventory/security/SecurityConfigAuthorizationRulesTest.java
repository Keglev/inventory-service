package com.smartsupplypro.inventory.security;

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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.SecurityAuthorizationHelper;
import com.smartsupplypro.inventory.config.SecurityConfig;
import com.smartsupplypro.inventory.config.SecurityEntryPointHelper;
import com.smartsupplypro.inventory.config.SecurityFilterHelper;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import com.smartsupplypro.inventory.service.CustomOAuth2UserService;
import com.smartsupplypro.inventory.service.CustomOidcUserService;

/**
 * MVC slice tests that exercise the production {@link SecurityConfig} authorization rules.
 *
 * <h2>Why this test exists</h2>
 * Most controller-level tests intentionally import a simplified {@code TestSecurityConfig} to keep
 * business tests focused and fast. That strategy is correct for controller coverage, but it means the
 * production security rules (request classification, entry points, and authorization matchers) must be
 * validated separately.
 *
 * <h2>Design</h2>
 * <ul>
 *   <li>Use {@link WebMvcTest} with <em>stub controllers</em> only (no coupling to production controllers).</li>
 *   <li>Import the real {@link SecurityConfig} plus helper components:
 *       {@link SecurityAuthorizationHelper}, {@link SecurityFilterHelper}, {@link SecurityEntryPointHelper}.</li>
 *   <li>Provide minimal required beans via {@link TestConfiguration} to satisfy SecurityConfig wiring.</li>
 *   <li>Set explicit properties to control security branches:
 *       {@code app.demo-readonly=false} and {@code app.frontend.base-url=https://frontend.test}.</li>
 * </ul>
 *
 * <h2>Validations</h2>
 * <ul>
 *   <li><b>Entry points:</b> unauthenticated API requests get 401 JSON; web requests redirect to login.</li>
 *   <li><b>RBAC:</b> USER is forbidden from {@code /api/admin/**}; ADMIN is allowed.</li>
 *   <li><b>Demo-readonly OFF:</b> inventory GET requires authentication.</li>
 *   <li><b>PermitAll:</b> {@code /api/health/**} is not blocked by security filters.</li>
 *   <li><b>Logout hardening:</b> return URL allow-listing prevents open redirects.</li>
 * </ul>
 */
@SuppressWarnings("unused")
@WebMvcTest(controllers = { AdminStubController.class, TestApiStubController.class })
@AutoConfigureMockMvc(addFilters = true)
@ActiveProfiles({"test", "test-stub"})
@TestPropertySource(properties = {
    "app.demo-readonly=false",
    "app.frontend.base-url=https://frontend.test",
    "spring.main.banner-mode=off",
    "logging.level.root=WARN"
})
@Import({
    SecurityConfig.class,
    SecurityAuthorizationHelper.class,
    SecurityFilterHelper.class,
    SecurityEntryPointHelper.class,
    SecurityConfigAuthorizationRulesTest.TestBeans.class
})
class SecurityConfigAuthorizationRulesTest {

    @Autowired
    private MockMvc mvc;

    @Test
    @DisplayName("Unauthenticated API request returns 401 JSON (not a redirect)")
    void unauthenticated_apiRequest_returns401Json() throws Exception {
        // API-shaped request (Accept: application/json) must yield a JSON 401, not a browser redirect.
        mvc.perform(get("/api/admin/ping")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isUnauthorized())
            .andExpect(header().string("Content-Type", org.hamcrest.Matchers.containsString("application/json")))
            .andExpect(content().string("{\"message\":\"Unauthorized\"}"));
    }

    @Test
    @DisplayName("Unauthenticated web request redirects to frontend login")
    void unauthenticated_webRequest_redirectsToFrontendLogin() throws Exception {
        // Non-JSON (default) requests should follow a browser-friendly redirect flow.
        mvc.perform(get("/api/admin/ping"))
            .andExpect(status().is3xxRedirection())
            .andExpect(header().string("Location", "https://frontend.test/login"));
    }

    @Test
    @DisplayName("USER role cannot access /api/admin/**")
    @WithMockUser(username = "user", roles = "USER")
    void userRole_isForbiddenFromAdminEndpoints() throws Exception {
        mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN role can access /api/admin/**")
    @WithMockUser(username = "admin", roles = "ADMIN")
    void adminRole_canAccessAdminEndpoints() throws Exception {
        mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().string("admin ok"));
    }

    @Test
    @DisplayName("When demo-readonly is OFF, inventory GET requires authentication")
    void demoReadonlyOff_inventoryGet_requiresAuth() throws Exception {
        mvc.perform(get("/api/inventory/demo-ok").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("When demo-readonly is OFF, authenticated users can GET inventory")
    @WithMockUser(username = "user", roles = "USER")
    void demoReadonlyOff_inventoryGet_authenticatedUser_ok() throws Exception {
        mvc.perform(get("/api/inventory/demo-ok").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().json("{\"status\":\"ok\"}"));
    }

    @Test
    @DisplayName("SecurityConfig permitAll for /api/health/** (should reach MVC and return 404 if no handler)")
    void apiHealth_isPermitAll() throws Exception {
        // We intentionally do not register a /api/health handler in this slice;
        // the 404 proves the request reached MVC instead of being blocked by security.
        mvc.perform(get("/api/health")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Logout (API-shaped request attribute) returns 204")
    void logout_whenApiRequestAttributeSet_returns204() throws Exception {
        // The logout success handler supports an API mode (204) when the request is marked as API.
        mvc.perform(post("/logout")
                .requestAttr("IS_API_REQUEST", Boolean.TRUE)
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Logout allows return URL only when it starts with frontend base URL")
    void logout_returnUrl_allowListed_redirects() throws Exception {
        mvc.perform(post("/logout")
                .param("return", "https://frontend.test/custom")
                .accept(MediaType.TEXT_HTML))
            .andExpect(status().is3xxRedirection())
            .andExpect(header().string("Location", "https://frontend.test/custom"));
    }

    @Test
    @DisplayName("Logout rejects external return URL and uses safe default")
    void logout_returnUrl_external_rejected_redirectsToSafeDefault() throws Exception {
        mvc.perform(post("/logout")
                .param("return", "https://evil.example/phish")
                .accept(MediaType.TEXT_HTML))
            .andExpect(status().is3xxRedirection())
            .andExpect(header().string("Location", "https://frontend.test/logout-success"));
    }

    @Test
    @DisplayName("Logout without return parameter uses safe default")
    void logout_withoutReturnParam_redirectsToSafeDefault() throws Exception {
        mvc.perform(post("/logout")
                .accept(MediaType.TEXT_HTML))
            .andExpect(status().is3xxRedirection())
            .andExpect(header().string("Location", "https://frontend.test/logout-success"));
    }

    @TestConfiguration
    static class TestBeans {

        /**
         * Minimal beans required for {@link SecurityConfig} to initialize in a {@link WebMvcTest} slice.
         *
         * <p>These are provided as {@code @Bean} methods so they exist before the context refresh.
         * This avoids initialization-time autowiring failures that can occur when using late-bound
         * mocking annotations in sliced test contexts.</p>
         */

        @Bean
        OAuth2LoginSuccessHandler successHandler() {
            return Mockito.mock(OAuth2LoginSuccessHandler.class);
        }

        @Bean
        AppUserRepository appUserRepository() {
            return Mockito.mock(AppUserRepository.class);
        }

        @Bean
        CustomOAuth2UserService customOAuth2UserService(AppUserRepository repo) {
            return Mockito.mock(CustomOAuth2UserService.class);
        }

        @Bean
        CustomOidcUserService customOidcUserService(AppUserRepository repo) {
            return Mockito.mock(CustomOidcUserService.class);
        }

        @Bean
        ClientRegistrationRepository clientRegistrationRepository() {
            // Provide a deterministic in-memory OAuth2 registration used by the /oauth2 endpoints.
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
            return new InMemoryClientRegistrationRepository(google);
        }
    }
}
