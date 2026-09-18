package com.smartsupplypro.inventory.security;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
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

/**
 * Tests for production {@link SecurityConfig} authorization rules, entry points, and logout behavior.
 */
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
    SecurityTestBeans.class
})
class SecurityConfigAuthorizationRulesTest {

    @Autowired
    private MockMvc mvc;

    /**
     * Behavior when the request is unauthenticated.
     */
    @Nested
    class WhenUnauthenticated {

        @Test
        void should_return_401_json_when_an_api_request_is_unauthenticated() throws Exception {
            mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Content-Type",
                    org.hamcrest.Matchers.containsString("application/json")))
                .andExpect(content().string("{\"message\":\"Unauthorized\"}"));
        }

        @Test
        void should_redirect_to_the_frontend_login_when_a_web_request_is_unauthenticated() throws Exception {
            mvc.perform(get("/api/admin/ping"))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", "https://frontend.test/login"));
        }

        @Test
        void should_return_401_when_demo_readonly_is_off_and_an_inventory_get_is_unauthenticated() throws Exception {
            mvc.perform(get("/api/inventory/demo-ok").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
        }

        @Test
        void should_reach_mvc_when_the_api_health_endpoint_is_requested() throws Exception {
            // 404 confirms the request passed security and reached MVC (no handler registered in this slice).
            mvc.perform(get("/api/health").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
        }
    }

    /**
     * Behavior when the request carries an authenticated principal.
     */
    @Nested
    class WhenAuthenticated {

        @Test
        @WithMockUser(username = "user", roles = "USER")
        void should_return_403_when_the_user_role_accesses_an_admin_endpoint() throws Exception {
            mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(username = "admin", roles = "ADMIN")
        void should_return_200_when_the_admin_role_accesses_an_admin_endpoint() throws Exception {
            mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().string("admin ok"));
        }

        @Test
        @WithMockUser(username = "user", roles = "USER")
        void should_return_200_when_demo_readonly_is_off_and_an_inventory_get_is_authenticated() throws Exception {
            mvc.perform(get("/api/inventory/demo-ok").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"status\":\"ok\"}"));
        }
    }

    /**
     * Behavior when the client initiates a logout.
     */
    @Nested
    class WhenLoggingOut {

        @Test
        void should_return_204_when_an_api_logout_carries_the_api_request_attribute() throws Exception {
            mvc.perform(post("/logout")
                    .requestAttr("IS_API_REQUEST", Boolean.TRUE)
                    .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());
        }

        @Test
        void should_redirect_to_the_return_url_when_the_logout_return_param_matches_the_frontend_base() throws Exception {
            mvc.perform(post("/logout")
                    .param("return", "https://frontend.test/custom")
                    .accept(MediaType.TEXT_HTML))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", "https://frontend.test/custom"));
        }

        @Test
        void should_redirect_to_a_safe_default_when_the_logout_return_param_is_external() throws Exception {
            mvc.perform(post("/logout")
                    .param("return", "https://evil.example/phish")
                    .accept(MediaType.TEXT_HTML))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", "https://frontend.test/logout-success"));
        }

        @Test
        void should_redirect_to_a_safe_default_when_the_logout_has_no_return_param() throws Exception {
            mvc.perform(post("/logout").accept(MediaType.TEXT_HTML))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", "https://frontend.test/logout-success"));
        }
    }
}
