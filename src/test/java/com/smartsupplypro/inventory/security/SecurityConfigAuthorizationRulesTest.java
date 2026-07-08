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
        void should_return401Json_when_unauthenticatedApiRequest() throws Exception {
            mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Content-Type",
                    org.hamcrest.Matchers.containsString("application/json")))
                .andExpect(content().string("{\"message\":\"Unauthorized\"}"));
        }

        @Test
        void should_redirectToFrontendLogin_when_unauthenticatedWebRequest() throws Exception {
            mvc.perform(get("/api/admin/ping"))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", "https://frontend.test/login"));
        }

        @Test
        void should_return401_when_demoReadonlyOffAndUnauthenticatedInventoryGet() throws Exception {
            mvc.perform(get("/api/inventory/demo-ok").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
        }

        @Test
        void should_reachMvc_when_apiHealthRequested() throws Exception {
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
        @WithMockUser(username = "user", roles = "USER")
        void should_return200_when_demoReadonlyOffAndAuthenticatedInventoryGet() throws Exception {
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
    }
}
