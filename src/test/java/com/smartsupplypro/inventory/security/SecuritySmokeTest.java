package com.smartsupplypro.inventory.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.config.CorsConfig;
import com.smartsupplypro.inventory.config.OAuth2Config;
import com.smartsupplypro.inventory.config.SecurityConfig;

/**
 * Smoke tests for the production {@link SecurityConfig}: bean wiring,
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
    SecuritySmokeTestBeans.class
})
class SecuritySmokeTest {

    @Autowired MockMvc mvc;
    @Autowired OAuth2LoginSuccessHandler successHandler;
    @Autowired ClientRegistrationRepository clientRegistrationRepository;
    @Autowired AppProperties appProperties;

    /**
     * Behavior when verifying critical beans; the admin endpoint's access rules are
     * covered once, in {@link SecurityConfigAuthorizationRulesTest}.
     */
    @Nested
    class WhenCheckingContextAndAccess {

        @Test
        void should_autowire_all_critical_beans_when_the_context_loads() {
            assertThat(successHandler).isNotNull();
            assertThat(clientRegistrationRepository.findByRegistrationId("google")).isNotNull();
            assertThat(appProperties).isNotNull();
        }
    }

    /**
     * Behavior when verifying cross-cutting infrastructure (CORS, OAuth2).
     */
    @Nested
    class WhenCheckingInfrastructure {

        @Test
        void should_allow_the_origin_with_credentials_when_a_cors_preflight_comes_from_the_dev_frontend() throws Exception {
            mvc.perform(options("/api/admin/ping")
                    .header("Origin", "http://localhost:5173")
                    .header("Access-Control-Request-Method", "GET"))
               .andExpect(status().isOk())
               .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
               .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        }

        @Test
        void should_redirect_to_the_oauth_provider_when_the_authorization_endpoint_is_accessed() throws Exception {
            mvc.perform(get("/oauth2/authorization/google"))
               .andExpect(status().is3xxRedirection());
        }
    }

}
