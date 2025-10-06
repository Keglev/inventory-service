package com.smartsupplypro.inventory.security;

import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Test-only stub controller for security testing.
 * 
 * <p>This controller provides minimal API endpoints for testing security rules
 * without requiring the full application context. It's marked with {@code @Profile("test-stub")}
 * to prevent accidental loading in {@code @SpringBootTest} contexts (which use {@code @ActiveProfiles("test")}).</p>
 * 
 * <p><strong>Usage:</strong> Only use with {@code @WebMvcTest} and {@code @ActiveProfiles("test-stub")} 
 * to isolate security tests.</p>
 * 
 * @see DemoReadonlySecurityTest
 * @see ApiEntryPointBehaviourTest
 */
@Profile("test-stub")  // Only loaded when "test-stub" profile is active
@RestController
@RequestMapping("/api")
public class TestApiStubController {

    /**
     * Stub endpoint for inventory status check.
     */
    @GetMapping(value = "/inventory/demo-ok", produces = MediaType.APPLICATION_JSON_VALUE)
    public String inventoryOk() {
        return "{\"status\":\"ok\"}";
    }

    /**
     * Stub endpoint for analytics summary.
     */
    @GetMapping(value = "/analytics/summary", produces = MediaType.APPLICATION_JSON_VALUE)
    public String analyticsSummary() {
        return "{\"status\":\"ok\"}";
    }

    /**
     * Stub endpoint for patching inventory item price.
     */
    @PatchMapping(value = "/inventory/{id}/price", produces = MediaType.APPLICATION_JSON_VALUE)
    public String patchPrice(@PathVariable String id) {
        return "{\"status\":\"patched\"}";
    }
}
