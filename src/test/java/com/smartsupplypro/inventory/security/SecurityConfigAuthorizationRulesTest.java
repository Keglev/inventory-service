package com.smartsupplypro.inventory.security;

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

import com.smartsupplypro.inventory.config.OAuth2Config;
import com.smartsupplypro.inventory.config.SecurityAuthorizationHelper;
import com.smartsupplypro.inventory.config.SecurityConfig;
import com.smartsupplypro.inventory.config.SecurityEntryPointHelper;
import com.smartsupplypro.inventory.config.SecurityFilterHelper;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import com.smartsupplypro.inventory.service.CustomOAuth2UserService;
import com.smartsupplypro.inventory.service.CustomOidcUserService;

/**
 * Verifies production {@link SecurityConfig} authorization rules, entry points, and logout behavior.
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
    OAuth2Config.class,
    SecurityConfigAuthorizationRulesTest.TestBeans.class
})
class SecurityConfigAuthorizationRulesTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void should_return401Json_when_unauthenticatedApiRequest() throws Exception {
        mvc.perform(get("/api/admin/ping")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isUnauthorized())
            .andExpect(header().string("Content-Type", org.hamcrest.Matchers.containsString("application/json")))
            .andExpect(content().string("{\"message\":\"Unauthorized\"}"));
    }

    @Test
    void should_redirectToFrontendLogin_when_unauthenticatedWebRequest() throws Exception {
        mvc.perform(get("/api/admin/ping"))
            .andExpect(status().is3xxRedirection())
            .andExpect(header().string("Location", "https://frontend.test/login"));
    }

    @Test
    @WithMockUser(username = "user", roles = "USER")
    void should_return403_when_userRoleAccessesAdminEndpoint() throws Exception {
        mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void should_return200_when_adminRoleAccessesAdminEndpoint() throws Exception {
        mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().string("admin ok"));
    }

    @Test
    void should_return401_when_demoReadonlyOffAndUnauthenticatedInventoryGet() throws Exception {
        mvc.perform(get("/api/inventory/demo-ok").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user", roles = "USER")
    void should_return200_when_demoReadonlyOffAndAuthenticatedInventoryGet() throws Exception {
        mvc.perform(get("/api/inventory/demo-ok").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().json("{\"status\":\"ok\"}"));
    }

    @Test
    void should_reachMvc_when_apiHealthRequested() throws Exception {
        // 404 confirms the request passed security and reached MVC (no handler registered in this slice)
        mvc.perform(get("/api/health").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }

    @Test
    void should_return204_when_apiLogoutWithApiRequestAttribute() throws Exception {
        mvc.perform(post("/logout")
                .requestAttr("IS_API_REQUEST", Boolean.TRUE)
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());
    }

    @Test
    void should_redirectToReturnUrl_when_logoutReturnParamMatchesFrontendBase() throws Exception {
        mvc.perform(post("/logout")
                .param("return", "https://frontend.test/custom")
                .accept(MediaType.TEXT_HTML))
            .andExpect(status().is3xxRedirection())
            .andExpect(header().string("Location", "https://frontend.test/custom"));
    }

    @Test
    void should_redirectToSafeDefault_when_logoutReturnParamIsExternal() throws Exception {
        mvc.perform(post("/logout")
                .param("return", "https://evil.example/phish")
                .accept(MediaType.TEXT_HTML))
            .andExpect(status().is3xxRedirection())
            .andExpect(header().string("Location", "https://frontend.test/logout-success"));
    }

    @Test
    void should_redirectToSafeDefault_when_logoutHasNoReturnParam() throws Exception {
        mvc.perform(post("/logout").accept(MediaType.TEXT_HTML))
            .andExpect(status().is3xxRedirection())
            .andExpect(header().string("Location", "https://frontend.test/logout-success"));
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
            // Stub Google registration satisfies the OAuth2 filter chain without real credentials
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
