package com.smartsupplypro.inventory.repository.custom.util;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

/**
 * Unit tests for {@link DatabaseDialectDetector}.
 *
 * <p><strong>Context</strong></p>
 * <p>This project uses native SQL in multiple custom repositories where the SQL differs by database dialect.
 * {@link DatabaseDialectDetector} centralizes the decision of "H2 vs Oracle" using Spring active profiles,
 * preventing scattered environment checks throughout repository implementations.
 *
 * <p><strong>Behavior under test</strong></p>
 * <ul>
 *   <li>{@link DatabaseDialectDetector#isH2()} returns {@code true} when any active profile equals
 *       {@code "test"} or {@code "h2"} (case-insensitive).</li>
 *   <li>{@link DatabaseDialectDetector#isOracle()} is the logical inverse of {@link DatabaseDialectDetector#isH2()}.</li>
 * </ul>
 *
 * <p><strong>Test strategy</strong></p>
 * <ul>
 *   <li>Mock {@link Environment#getActiveProfiles()} to keep tests fast and deterministic.</li>
 *   <li>Drive the {@code anyMatch(...)} predicate through: match via {@code "test"}, match via {@code "h2"},
 *       and no match (including empty profile arrays).</li>
 * </ul>
 *
 * <p><strong>Branch matrix</strong></p>
 * <ul>
 *   <li><em>Match first disjunct</em>: profile contains {@code "test"}.</li>
 *   <li><em>Match second disjunct</em>: profile contains {@code "h2"}.</li>
 *   <li><em>No match</em>: profiles contain neither, and empty profiles.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class DatabaseDialectDetectorTest {

    @Mock private Environment environment;

    @Test
    @DisplayName("isH2: returns true when 'test' profile is active (case-insensitive)")
    void isH2_returnsTrue_whenTestProfileActive_caseInsensitive() {
        // Arrange: exercise the 'test' disjunct (case-insensitive).
        org.mockito.Mockito.when(environment.getActiveProfiles()).thenReturn(new String[] {"TeSt"});
        DatabaseDialectDetector detector = new DatabaseDialectDetector(environment);

        // Act + Assert: H2 is selected; Oracle is the inverse.
        assertTrue(detector.isH2());
        assertFalse(detector.isOracle());
    }

    @Test
    @DisplayName("isH2: returns true when 'h2' profile is active (case-insensitive)")
    void isH2_returnsTrue_whenH2ProfileActive_caseInsensitive() {
        // Arrange: exercise the 'h2' disjunct (case-insensitive).
        org.mockito.Mockito.when(environment.getActiveProfiles()).thenReturn(new String[] {"H2"});
        DatabaseDialectDetector detector = new DatabaseDialectDetector(environment);

        // Act + Assert: H2 is selected; Oracle is the inverse.
        assertTrue(detector.isH2());
        assertFalse(detector.isOracle());
    }

    @Test
    @DisplayName("isH2: returns false when neither 'test' nor 'h2' profiles are active")
    void isH2_returnsFalse_whenNoMatchingProfilesActive() {
        // Arrange: cover the "no match" path (typical production-like profiles).
        org.mockito.Mockito.when(environment.getActiveProfiles()).thenReturn(new String[] {"prod", "oracle"});
        DatabaseDialectDetector detector = new DatabaseDialectDetector(environment);

        // Act + Assert: H2 is not selected; Oracle becomes the default.
        assertFalse(detector.isH2());
        assertTrue(detector.isOracle());
    }

    @Test
    @DisplayName("isH2: returns true when multiple profiles include h2 among non-matching profiles")
    void isH2_returnsTrue_whenMultipleProfilesContainH2() {
        // Arrange: ensure anyMatch() returns true when H2 appears among other profiles.
        org.mockito.Mockito.when(environment.getActiveProfiles()).thenReturn(new String[] {"prod", "H2"});
        DatabaseDialectDetector detector = new DatabaseDialectDetector(environment);

        // Act + Assert: at least one matching profile is sufficient.
        assertTrue(detector.isH2());
        assertFalse(detector.isOracle());
    }

    @Test
    @DisplayName("isH2: returns false when no profiles are active")
    void isH2_returnsFalse_whenNoProfilesActive() {
        // Arrange: explicitly cover the edge case where Spring reports no active profiles.
        org.mockito.Mockito.when(environment.getActiveProfiles()).thenReturn(new String[0]);
        DatabaseDialectDetector detector = new DatabaseDialectDetector(environment);

        // Act + Assert: with no matching profiles, H2 is not selected.
        assertFalse(detector.isH2());
        assertTrue(detector.isOracle());
    }
}
