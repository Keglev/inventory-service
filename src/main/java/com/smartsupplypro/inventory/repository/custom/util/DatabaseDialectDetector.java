package com.smartsupplypro.inventory.repository.custom.util;

import java.util.Arrays;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Spring profile–based detector that signals whether the active database is H2 or Oracle.
 */
@Component
public class DatabaseDialectDetector {

    private final Environment environment;

    public DatabaseDialectDetector(Environment environment) {
        this.environment = environment;
    }

    /**
     * Returns {@code true} when the {@code test} or {@code h2} Spring profile is active.
     *
     * @return true if H2 dialect should be used, false for Oracle
     */
    public boolean isH2() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(p -> p.equalsIgnoreCase("test") || p.equalsIgnoreCase("h2"));
    }

    /**
     * Returns {@code true} when Oracle dialect should be used (inverse of {@link #isH2()}).
     *
     * @return true if Oracle dialect should be used
     */
    public boolean isOracle() {
        return !isH2();
    }
}
