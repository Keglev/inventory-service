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
        assertThat(successHandler).isNotNull();
        assertThat(customOAuth2UserService).isNotNull();
        assertThat(clientRegistrationRepository.findByRegistrationId("google")).isNotNull();
        assertThat(appProperties).isNotNull();
    }

    @Test
    @DisplayName("ADMIN role gets 200 on /api/admin/ping")
    @WithMockUser(username = "admin", roles = "ADMIN")
    void adminCanAccessAdmin() throws Exception {
        mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
           .andExpect(status().isOk())
           .andExpect(content().string("admin ok"));
    }

    @Test
    @DisplayName("USER role gets 403 on /api/admin/ping")
    @WithMockUser(username = "user", roles = "USER")
    void userCannotAccessAdmin() throws Exception {
        mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
           .andExpect(status().isForbidden());
    }

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

    @Test
    @DisplayName("OAuth authorization endpoint is permitted (redirects)")
    void oauthAuthorizationEndpointIsPermitted() throws Exception {
        mvc.perform(get("/oauth2/authorization/google"))
           .andExpect(status().is3xxRedirection());
    }

    /**
     * Test-time beans required by SecurityConfig, provided up-front.
     * No @MockBean / @MockitoBean is used; these are standard @Bean definitions.
     */
    @TestConfiguration
    static class TestBeans {

        @Bean
        @SuppressWarnings("unused")
        OAuth2LoginSuccessHandler successHandler() {
            return Mockito.mock(OAuth2LoginSuccessHandler.class);
        }

        @Bean
        @SuppressWarnings("unused")
        AppUserRepository appUserRepository() {
            return Mockito.mock(AppUserRepository.class);
        }

        @Bean
        @SuppressWarnings("unused")
        CustomOAuth2UserService customOAuth2UserService(AppUserRepository appUserRepository) {
            // Provide the mock; Spring will still run autowiring and find the repo above.
            return Mockito.mock(CustomOAuth2UserService.class);
        }

        @Bean
        @SuppressWarnings("unused")
        ClientRegistrationRepository clientRegistrationRepository() {
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

        // IMPORTANT: Do NOT declare an AppProperties @Bean here.
        // SecurityConfig’s @EnableConfigurationProperties(AppProperties.class) already provides it.
    }
}