package com.smartsupplypro.inventory;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/**
 * Integration test to verify if the Spring ApplicationContext loads correctly.
 * <p>
 * Disabled in CI by default to avoid issues with unavailable Docker/Testcontainers setup.
 * It can be enabled locally or in staging with appropriate testcontainers support.
 * </p>
 */
@Disabled("Disabled in CI due to potential Oracle Testcontainers conflict")
@Import(TestContainersOracleConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class InventoryServiceApplicationTest {

    /**
     * Tests if the application context loads successfully.
     * This is useful for catching configuration or bean wiring errors.
     */
    @Test
    void contextLoads() {
        // Left intentionally empty — will fail if Spring context cannot start
    }
}
