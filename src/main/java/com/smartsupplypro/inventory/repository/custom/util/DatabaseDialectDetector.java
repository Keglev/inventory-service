package com.smartsupplypro.inventory.repository.custom.util;

import java.util.Arrays;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Database dialect detection utility for multi-database support.
 *
 * <p>Determines active database engine (H2 vs Oracle) based on Spring profiles,
 * enabling dialect-specific SQL generation in custom repositories without
 * hardcoding environment checks.
 *
 * <p><strong>Usage Pattern</strong>:
 * <pre>
 * String sql = dialectDetector.isH2()
 *     ? "SELECT YEAR(created_at) ..." // H2 syntax
 *     : "SELECT TO_CHAR(created_at, 'YYYY') ..."; // Oracle syntax
 * </pre>
 *
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 2.0.0
 */
@Component
public class DatabaseDialectDetector {

    private final Environment environment;

    public DatabaseDialectDetector(Environment environment) {
        this.environment = environment;
    }

    /**
     * Detects H2 database mode based on active Spring profiles.
     * Returns true if 'test' or 'h2' profile is active.
     *
     * @return true if H2 dialect should be used, false for Oracle
     */
    public boolean isH2() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(p -> p.equalsIgnoreCase("test") || p.equalsIgnoreCase("h2"));
    }

    /**
     * Detects Oracle database mode (inverse of H2 check).
     *
     * @return true if Oracle dialect should be used
     */
    public boolean isOracle() {
        return !isH2();
    }
}
