package com.smartsupplypro.inventory.security;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.annotation.Resource;

/**
 * Tests for demo-readonly mode using a minimal in-test security chain:
 * GET requests to inventory and analytics are public; writes remain protected.
 */
@WebMvcTest(controllers = TestApiStubController.class)
@AutoConfigureMockMvc(addFilters = true)
@Import(DemoReadonlyTestSecurityConfig.class)
@org.springframework.test.context.ActiveProfiles("test-stub")
class DemoReadonlySecurityTest {

    @Resource
    private MockMvc mockMvc;

    /**
     * Behavior when the request is an unauthenticated read.
     */
    @Nested
    class WhenRequestIsUnauthenticatedRead {

        @Test
        void should_permit_unauthenticated_get_on_inventory_endpoint_in_demo_mode() throws Exception {
            mockMvc.perform(get("/api/inventory/demo-ok").accept(MediaType.APPLICATION_JSON))
                   .andExpect(status().isOk())
                   .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                   .andExpect(content().json("{\"status\":\"ok\"}"));
        }

        @Test
        void should_permit_unauthenticated_get_on_analytics_endpoint_in_demo_mode() throws Exception {
            mockMvc.perform(get("/api/analytics/summary").accept(MediaType.APPLICATION_JSON))
                   .andExpect(status().isOk())
                   .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                   .andExpect(content().json("{\"status\":\"ok\"}"));
        }
    }

    /**
     * Behavior when the request is an unauthenticated write.
     */
    @Nested
    class WhenRequestIsUnauthenticatedWrite {

        @Test
        void should_block_unauthenticated_write_request_in_demo_mode() throws Exception {
            mockMvc.perform(patch("/api/inventory/123/price").accept(MediaType.APPLICATION_JSON))
                   .andExpect(status().isUnauthorized())
                   .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                   .andExpect(content().json("{\"message\":\"Unauthorized\"}"));
        }
    }

}
