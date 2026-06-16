package com.smartsupplypro.inventory.security;

import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Minimal API stub for security slice tests requiring inventory and analytics endpoints.
 * Loaded only under the {@code test-stub} profile to prevent accidental pickup in full-context tests.
 */
@Profile("test-stub")
@RestController
@RequestMapping("/api")
public class TestApiStubController {

    @GetMapping(value = "/inventory/demo-ok", produces = MediaType.APPLICATION_JSON_VALUE)
    public String inventoryOk() {
        return "{\"status\":\"ok\"}";
    }

    @GetMapping(value = "/analytics/summary", produces = MediaType.APPLICATION_JSON_VALUE)
    public String analyticsSummary() {
        return "{\"status\":\"ok\"}";
    }

    @PatchMapping(value = "/inventory/{id}/price", produces = MediaType.APPLICATION_JSON_VALUE)
    public String patchPrice(@PathVariable String id) {
        return "{\"status\":\"patched\"}";
    }
}
