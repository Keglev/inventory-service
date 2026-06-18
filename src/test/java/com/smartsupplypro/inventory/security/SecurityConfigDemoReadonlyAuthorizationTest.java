package com.smartsupplypro.inventory.security;

import org.junit.jupiter.api.Nested;
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
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartsupplypro.inventory.config.OAuth2Config;
import com.smartsupplypro.inventory.config.SecurityAuthorizationHelper;
import com.smartsupplypro.inventory.config.SecurityConfig;
import com.smartsupplypro.inventory.config.SecurityEntryPointHelper;
import com.smartsupplypro.inventory.config.SecurityFilterHelper;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import com.smartsupplypro.inventory.service.CustomOAuth2UserService;
import com.smartsupplypro.inventory.service.CustomOidcUserService;

/**
 * Tests for the demo-readonly authorization branch in {@link SecurityAuthorizationHelper}:
 * read-only endpoints are public, mutation endpoints remain protected.
 */
@WebMvcTest(controllers = { SecurityConfigDemoReadonlyAuthorizationTest.DemoApiStubController.class })
@AutoConfigureMockMvc(addFilters = true)
@ActiveProfiles({"test", "demo-readonly-test"})
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
    OAuth2Config.class,
    SecurityConfigDemoReadonlyAuthorizationTest.DemoApiStubController.class,
    SecurityConfigDemoReadonlyAuthorizationTest.TestBeans.class
})
class SecurityConfigDemoReadonlyAuthorizationTest {

    @Autowired
    private MockMvc mvc;

    /**
     * Behavior when demo-readonly is enabled.
     */
    @Nested
    class WhenDemoReadonlyIsEnabled {

        @Test
        void should_allowAnonymousGet_when_demoReadonlyOnAndInventoryEndpoint() throws Exception {
            mvc.perform(get("/api/inventory/demo-ok").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"status\":\"ok\"}"));
        }

        @Test
        void should_allowAnonymousGet_when_demoReadonlyOnAndAnalyticsEndpoint() throws Exception {
            mvc.perform(get("/api/analytics/summary").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"status\":\"ok\"}"));
        }

        @Test
        void should_return401_when_demoReadonlyOnAndUnauthenticatedInventoryPatch() throws Exception {
            mvc.perform(patch("/api/inventory/item-1/price").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @WithMockUser(username = "user", roles = "USER")
        void should_return200_when_demoReadonlyOnAndAuthenticatedInventoryPatch() throws Exception {
            mvc.perform(patch("/api/inventory/item-1/price").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"status\":\"patched\"}"));
        }
    }

    /** Minimal stub endpoints matching the security patterns under test. */
    @Profile("demo-readonly-test")
    @RestController
    @RequestMapping("/api")
    public static class DemoApiStubController {

        @GetMapping(value = "/inventory/demo-ok", produces = MediaType.APPLICATION_JSON_VALUE)
        public String inventoryOk() { return "{\"status\":\"ok\"}"; }

        @GetMapping(value = "/analytics/summary", produces = MediaType.APPLICATION_JSON_VALUE)
        public String analyticsSummary() { return "{\"status\":\"ok\"}"; }

        @PatchMapping(value = "/inventory/{id}/price", produces = MediaType.APPLICATION_JSON_VALUE)
        public String patchPrice(@PathVariable String id) { return "{\"status\":\"patched\"}"; }
    }

    @TestConfiguration
    static class TestBeans {

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
            // Stub Google registration satisfies the OAuth2 filter chain without real credentials.
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
