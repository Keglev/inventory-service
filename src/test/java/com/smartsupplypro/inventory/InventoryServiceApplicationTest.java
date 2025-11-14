package com.smartsupplypro.inventory;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Verifies Spring Boot application context loads successfully with test profile.
 * Uses H2 in-memory database with Oracle compatibility mode instead of Testcontainers
 * due to Oracle Autonomous Database IP whitelisting requirements.
 */
@SpringBootTest
@ActiveProfiles("test")
class InventoryServiceApplicationTest {

    /**
     * Smoke test verifying Spring context loads without errors.
     * Validates bean wiring, JPA entity mappings, and configuration binding.
     */
    @Test
    @SuppressWarnings("unused")
    void contextLoads() {
        // Context load failure will automatically fail the test
    }
}

