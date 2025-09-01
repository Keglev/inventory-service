package com.smartsupplypro.inventory.security;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * A simple controller to stub out API endpoints for testing purposes.
 */
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
