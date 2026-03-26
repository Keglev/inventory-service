package com.smartsupplypro.inventory;

import java.lang.reflect.Method;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.springframework.context.ConfigurableApplicationContext;

/**
 * Unit tests for {@link InventoryServiceApplication} entry-point behavior.
 *
 * <h2>Why this test exists</h2>
 * The Spring Boot application class is intentionally small, but JaCoCo still tracks executable bytecode
 * (not JavaDoc). A typical {@code @SpringBootTest} context smoke test does <em>not</em> invoke
 * {@link InventoryServiceApplication#main(String[])}, leaving the entry point uncovered.
 *
 * <h2>Test strategy</h2>
 * This test starts the application via {@code main(...)} using the {@code test} profile and
 * {@code web-application-type=none}, then immediately closes the context via a dedicated
 * test-only command-line flag ({@code --ssp.close=true}).
 *
 * <p><strong>Why not static mocking?</strong> Mockito static mocking normally requires the
 * {@code mockito-inline} artifact. In this codebase, the Spring Boot BOM pins Mockito core to a newer
 * release line where {@code mockito-inline} is not published, causing dependency resolution errors.
 * This approach avoids introducing that extra dependency while still covering the entry point.
 */
class InventoryServiceApplicationMainTest {

    @Test
    @Timeout(value = 30)
    @DisplayName("main starts and closes cleanly when the close flag is provided")
    void main_startsAndClosesCleanly_whenCloseFlagProvided() {
        assertDoesNotThrow(
                () -> InventoryServiceApplication.main(
                        new String[] {
                            "--spring.profiles.active=test",
                            "--spring.main.web-application-type=none",
                            "--spring.main.banner-mode=off",
                            "--spring.main.log-startup-info=false",
                            "--logging.level.root=OFF",
                            "--ssp.close=true"
                        }),
                () -> "main(..) should start the test profile and close without blocking. Timeout=" + Duration.ofSeconds(30));
    }

    @Test
    @Timeout(value = 30)
    @DisplayName("run starts and returns an active context when the close flag is NOT provided")
    void run_startsAndReturnsActiveContext_whenCloseFlagNotProvided() {
        try (ConfigurableApplicationContext applicationContext = InventoryServiceApplication.run(
                    new String[] {
                        "--spring.profiles.active=test",
                        "--spring.main.web-application-type=none",
                        "--spring.main.banner-mode=off",
                        "--spring.main.log-startup-info=false",
                        "--logging.level.root=OFF"
                    })) {

            assertNotNull(applicationContext, "run(..) must return the Spring application context");
            assertTrue(applicationContext.isActive(), "Context should remain active when close flag is absent");
        }
    }

    @Test
    @DisplayName("shouldCloseAfterStartup returns false for null args")
    void shouldCloseAfterStartup_returnsFalse_whenArgsNull() throws Exception {
        Method method = InventoryServiceApplication.class.getDeclaredMethod("shouldCloseAfterStartup", String[].class);
        method.setAccessible(true);

        boolean result = (boolean) method.invoke(null, (Object) null);
        assertFalse(result, "Null args should never trigger the test-only close behavior");
    }

    @Test
    @DisplayName("shouldCloseAfterStartup returns false for empty args")
    void shouldCloseAfterStartup_returnsFalse_whenArgsEmpty() throws Exception {
        Method method = InventoryServiceApplication.class.getDeclaredMethod("shouldCloseAfterStartup", String[].class);
        method.setAccessible(true);

        boolean result = (boolean) method.invoke(null, (Object) new String[0]);
        assertFalse(result, "Empty args should never trigger the test-only close behavior");
    }
}
