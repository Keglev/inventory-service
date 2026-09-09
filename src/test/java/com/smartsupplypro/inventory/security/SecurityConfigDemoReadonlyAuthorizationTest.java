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
    SecurityConfigDemoReadonlyTestBeans.class
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

}
