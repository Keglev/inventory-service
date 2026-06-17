package com.smartsupplypro.inventory.repository.custom.util;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

/**
 * Unit tests for dialect detection logic in {@link DatabaseDialectDetector}.
 */
@SuppressWarnings("unused")
@ExtendWith(MockitoExtension.class)
class DatabaseDialectDetectorTest {

    @Mock private Environment environment;

    /**
     * H2 dialect detection via 'test' or 'h2' profile match (case-insensitive).
     */
    @Nested
    @SuppressWarnings("unused")
    class H2Detection {

        @Test
        void should_detect_h2_when_test_profile_is_active_case_insensitive() {
            org.mockito.Mockito.when(environment.getActiveProfiles()).thenReturn(new String[] {"TeSt"});
            DatabaseDialectDetector detector = new DatabaseDialectDetector(environment);

            assertTrue(detector.isH2());
            assertFalse(detector.isOracle());
        }

        @Test
        void should_detect_h2_when_h2_profile_is_active_case_insensitive() {
            org.mockito.Mockito.when(environment.getActiveProfiles()).thenReturn(new String[] {"H2"});
            DatabaseDialectDetector detector = new DatabaseDialectDetector(environment);

            assertTrue(detector.isH2());
            assertFalse(detector.isOracle());
        }

        @Test
        void should_detect_h2_when_one_of_multiple_profiles_is_h2() {
            // anyMatch returns true when H2 appears among other non-matching profiles
            org.mockito.Mockito.when(environment.getActiveProfiles()).thenReturn(new String[] {"prod", "H2"});
            DatabaseDialectDetector detector = new DatabaseDialectDetector(environment);

            assertTrue(detector.isH2());
            assertFalse(detector.isOracle());
        }
    }

    /**
     * Oracle as the fallback when no H2 profiles are active.
     */
    @Nested
    @SuppressWarnings("unused")
    class OracleFallback {

        @Test
        void should_default_to_oracle_when_no_matching_profiles_are_active() {
            org.mockito.Mockito.when(environment.getActiveProfiles()).thenReturn(new String[] {"prod", "oracle"});
            DatabaseDialectDetector detector = new DatabaseDialectDetector(environment);

            assertFalse(detector.isH2());
            assertTrue(detector.isOracle());
        }

        @Test
        void should_default_to_oracle_when_no_profiles_are_active() {
            org.mockito.Mockito.when(environment.getActiveProfiles()).thenReturn(new String[0]);
            DatabaseDialectDetector detector = new DatabaseDialectDetector(environment);

            assertFalse(detector.isH2());
            assertTrue(detector.isOracle());
        }
    }
}
