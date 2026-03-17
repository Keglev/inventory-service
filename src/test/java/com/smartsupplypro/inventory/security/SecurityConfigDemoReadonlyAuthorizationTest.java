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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartsupplypro.inventory.config.SecurityAuthorizationHelper;
import com.smartsupplypro.inventory.config.SecurityConfig;
import com.smartsupplypro.inventory.config.SecurityEntryPointHelper;
import com.smartsupplypro.inventory.config.SecurityFilterHelper;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import com.smartsupplypro.inventory.service.CustomOAuth2UserService;
import com.smartsupplypro.inventory.service.CustomOidcUserService;

/**
 * MVC slice test for the demo-readonly authorization branch in {@link SecurityAuthorizationHelper}.
 *
 * <h2>Contract</h2>
 * When {@code app.demo-readonly=true} is enabled, selected read-only endpoints are public (no login),
 * but mutation endpoints remain protected.
 *
 * <h2>Design</h2>
 * <ul>
 *   <li>Use {@link WebMvcTest} with a local stub controller to keep the test deterministic.</li>
 *   <li>Import production {@link SecurityConfig} and helper components to exercise real matchers.</li>
 *   <li>Set explicit properties to force the demo-readonly branch and frontend login base URL.</li>
 * </ul>
 *
 * <h2>Why a stub controller?</h2>
 * This test intentionally avoids coupling security rule validation to production controllers that may be
 * profile-gated or expensive to load. The only requirement is that the endpoints match the configured
 * security patterns.
 */
@SuppressWarnings("unused")
@WebMvcTest(controllers = { SecurityConfigDemoReadonlyAuthorizationTest.DemoApiStubController.class })
@AutoConfigureMockMvc(addFilters = true)
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "app.demo-readonly=true",
    "app.frontend.base-url=https://frontend.test",
    "spring.main.banner-mode=off",
    "logging.level.root=WARN"
})
@Import({
    SecurityConfig.class,
    SecurityAuthorizationHelper.class,
    SecurityFilterHelper.class,
    SecurityEntryPointHelper.class,
    SecurityConfigDemoReadonlyAuthorizationTest.DemoApiStubController.class,
    SecurityConfigDemoReadonlyAuthorizationTest.TestBeans.class
})
class SecurityConfigDemoReadonlyAuthorizationTest {

    @Autowired
    private MockMvc mvc;

    /**
     * Minimal endpoints used to probe demo-readonly authorization behavior.
     *
     * <p>These handler methods are intentionally simple: they are not part of the test subject.
     * Their role is to ensure requests reach MVC so we can assert the security decision (401 vs 200).</p>
     */
    @RestController
    @RequestMapping("/api")
    public static class DemoApiStubController {

        @GetMapping(value = "/inventory/demo-ok", produces = MediaType.APPLICATION_JSON_VALUE)
        public String inventoryOk() {
            return "{\"status\":\"ok\"}";
        }

        @GetMapping(value = "/analytics/summary", produces = MediaType.APPLICATION_JSON_VALUE)
        public String analyticsSummary() {
            return "{\"status\":\"ok\"}";
        }

        @PatchMapping(value = "/inventory/{id}/price", produces = MediaType.APPLICATION_JSON_VALUE)
        public String patchPrice(@PathVariable String id) {
            return "{\"status\":\"patched\"}";
        }
    }

    @Test
    @DisplayName("Demo-readonly ON: inventory GET is public")
    void demoReadonlyOn_inventoryGet_isPermitAll() throws Exception {
        // With demo-readonly enabled, read-only inventory endpoints are expected to be public.
        mvc.perform(get("/api/inventory/demo-ok").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().json("{\"status\":\"ok\"}"));
    }

    @Test
    @DisplayName("Demo-readonly ON: analytics GET is public")
    void demoReadonlyOn_analyticsGet_isPermitAll() throws Exception {
        // Analytics summary is another read-only endpoint that is public in demo mode.
        mvc.perform(get("/api/analytics/summary").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().json("{\"status\":\"ok\"}"));
    }

    @Test
    @DisplayName("Demo-readonly ON: inventory PATCH still requires authentication")
    void demoReadonlyOn_inventoryPatch_stillRequiresAuth() throws Exception {
        // Mutations must remain protected even in demo-readonly mode.
        mvc.perform(patch("/api/inventory/item-1/price").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Demo-readonly ON: inventory PATCH allowed for authenticated user")
    @WithMockUser(username = "user", roles = "USER")
    void demoReadonlyOn_inventoryPatch_authenticated_ok() throws Exception {
        mvc.perform(patch("/api/inventory/item-1/price").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().json("{\"status\":\"patched\"}"));
    }

    @TestConfiguration
    static class TestBeans {

        /**
         * Minimal wiring required for {@link SecurityConfig} in a {@link WebMvcTest} slice.
         *
         * <p>Beans are provided up-front so SecurityConfig can autowire dependencies during context
         * initialization. The mocks are intentionally behavior-free: the tests focus on authorization
         * decisions, not OAuth flows or persistence.</p>
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
            // Provide a deterministic in-memory OAuth2 registration used by /oauth2 endpoints.
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
