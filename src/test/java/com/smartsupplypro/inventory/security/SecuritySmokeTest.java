package com.smartsupplypro.inventory.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.jspecify.annotations.NonNull;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.config.CorsConfig;
import com.smartsupplypro.inventory.config.OAuth2Config;
import com.smartsupplypro.inventory.config.SecurityConfig;
import com.smartsupplypro.inventory.service.CustomOAuth2UserService;

/**
 * Smoke tests for the production {@link SecurityConfig}: bean wiring, ADMIN/USER access control,
 * CORS preflight, and OAuth2 authorization endpoint reachability.
 */
@WebMvcTest(controllers = AdminStubController.class)
@AutoConfigureMockMvc(addFilters = true)
@TestPropertySource(properties = {
    "app.demo-readonly=false",
    "app.frontend.base-url=https://frontend.test",
    "spring.main.banner-mode=off",
    "logging.level.root=WARN"
})
@Import({
    SecurityConfig.class,
    OAuth2Config.class,
    CorsConfig.class,
    SecurityTestBeans.class,
    SecuritySmokeTest.TestBeans.class
})
class SecuritySmokeTest {

    @Autowired MockMvc mvc;
    @Autowired OAuth2LoginSuccessHandler successHandler;
    @Autowired CustomOAuth2UserService customOAuth2UserService;
    @Autowired ClientRegistrationRepository clientRegistrationRepository;
    @Autowired AppProperties appProperties;

    /**
     * Behavior when verifying critical beans and access control rules.
     */
    @Nested
    class WhenCheckingContextAndAccess {

        @Test
        void should_autowireAllCriticalBeans_when_contextLoads() {
            assertThat(successHandler).isNotNull();
            assertThat(customOAuth2UserService).isNotNull();
            assertThat(clientRegistrationRepository.findByRegistrationId("google")).isNotNull();
            assertThat(appProperties).isNotNull();
        }

        @Test
        @WithMockUser(username = "admin", roles = "ADMIN")
        void should_return200_when_adminRoleAccessesAdminEndpoint() throws Exception {
            mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
               .andExpect(status().isOk())
               .andExpect(content().string("admin ok"));
        }

        @Test
        @WithMockUser(username = "user", roles = "USER")
        void should_return403_when_userRoleAccessesAdminEndpoint() throws Exception {
            mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
               .andExpect(status().isForbidden());
        }
    }

    /**
     * Behavior when verifying cross-cutting infrastructure (CORS, OAuth2).
     */
    @Nested
    class WhenCheckingInfrastructure {

        @Test
        void should_allowOriginWithCredentials_when_corsPreflightFromDevFrontend() throws Exception {
            mvc.perform(options("/api/admin/ping")
                    .header("Origin", "http://localhost:5173")
                    .header("Access-Control-Request-Method", "GET"))
               .andExpect(status().isOk())
               .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
               .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        }

        @Test
        void should_redirectToOAuthProvider_when_authorizationEndpointAccessed() throws Exception {
            mvc.perform(get("/oauth2/authorization/google"))
               .andExpect(status().is3xxRedirection());
        }
    }

    /** Mocks for the three {@link SecurityConfig} helper dependencies not covered by {@link SecurityTestBeans}. */
    @TestConfiguration
    static class TestBeans {

        @Bean
        com.smartsupplypro.inventory.config.SecurityFilterHelper securityFilterHelper() {
            com.smartsupplypro.inventory.config.SecurityFilterHelper mock =
                Mockito.mock(com.smartsupplypro.inventory.config.SecurityFilterHelper.class);
            Mockito.when(mock.createApiDetectionFilter()).thenReturn(
                new org.springframework.web.filter.OncePerRequestFilter() {
                    @Override
                    protected void doFilterInternal(
                            jakarta.servlet.http.@NonNull HttpServletRequest req,
                            jakarta.servlet.http.@NonNull HttpServletResponse res,
                            jakarta.servlet.@NonNull FilterChain chain)
                            throws jakarta.servlet.ServletException, java.io.IOException {
                        chain.doFilter(req, res);
                    }
                });
            return mock;
        }

        @Bean
        com.smartsupplypro.inventory.config.SecurityEntryPointHelper securityEntryPointHelper() {
            com.smartsupplypro.inventory.config.SecurityEntryPointHelper mock =
                Mockito.mock(com.smartsupplypro.inventory.config.SecurityEntryPointHelper.class);
            Mockito.when(mock.createApiEntryPoint()).thenReturn((req, res, ex) ->
                res.sendError(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized"));
            Mockito.when(mock.createWebEntryPoint(Mockito.anyString())).thenReturn((req, res, ex) ->
                res.sendRedirect("/"));
            Mockito.when(mock.createLogoutSuccessHandler(Mockito.any())).thenReturn(
                (req, res, auth) -> res.sendRedirect("/"));
            return mock;
        }

        @Bean
        com.smartsupplypro.inventory.config.SecurityAuthorizationHelper securityAuthorizationHelper() {
            com.smartsupplypro.inventory.config.SecurityAuthorizationHelper mock =
                Mockito.mock(com.smartsupplypro.inventory.config.SecurityAuthorizationHelper.class);
            Mockito.doAnswer(invocation -> {
                org.springframework.security.config.annotation.web.configurers
                        .AuthorizeHttpRequestsConfigurer<?>.AuthorizationManagerRequestMatcherRegistry auth =
                    invocation.getArgument(0);
                auth.requestMatchers("/api/admin/**").hasRole("ADMIN");
                auth.anyRequest().authenticated();
                return null;
            }).when(mock).configureAuthorization(Mockito.any(), Mockito.anyBoolean());
            return mock;
        }

        // AppProperties is provided by @EnableConfigurationProperties on SecurityConfig — do not redeclare here
    }
}
