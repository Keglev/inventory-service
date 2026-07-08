package com.smartsupplypro.inventory;

import org.jspecify.annotations.NonNull;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ActiveProfilesResolver;

/**
 * Verifies Spring Boot application context loads successfully with test profile.
 * Uses H2 in-memory database with Oracle compatibility mode instead of Testcontainers
 * due to Oracle Autonomous Database IP whitelisting requirements.  
 */
@SpringBootTest
@ActiveProfiles(resolver = InventoryServiceApplicationTest.InventoryServiceActiveProfilesResolver.class)
class InventoryServiceApplicationTest {

    static final class InventoryServiceActiveProfilesResolver implements ActiveProfilesResolver {

        @Override
        public @NonNull String[] resolve(@NonNull Class<?> testClass) {
            if (isWalletTestEnabled()) {
                requireEnv("DB_URL");
                requireEnv("DB_USER");
                requireEnv("DB_PASS");
                requireEnv("TNS_ADMIN");
                return new String[] { "oracle-it" };
            }

            return new String[] { "test" };
        }

        private static boolean isWalletTestEnabled() {
            String env = System.getenv("ENABLE_WALLET_TEST");
            return (env != null && Boolean.parseBoolean(env))
                || Boolean.parseBoolean(System.getProperty("enableWalletTest", "false"));
        }

        private static void requireEnv(String name) {
            String value = System.getenv(name);
            if (value == null || value.isBlank()) {
                throw new IllegalStateException(
                    "Oracle wallet test is enabled, but required environment variable is missing/blank: " + name);
            }
        }
    }

    /**
     * Smoke test verifying Spring context loads without errors.
     * Validates bean wiring, JPA entity mappings, and configuration binding.
     */
    @Test
    void contextLoads() {
        // Context load failure will automatically fail the test
    }
}

