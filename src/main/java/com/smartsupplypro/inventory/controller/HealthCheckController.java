package com.smartsupplypro.inventory.controller;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for application and database health monitoring.
 *
 * <p>These endpoints are publicly accessible (no authentication required)
 * and serve frontend polling and infrastructure probes.
 * Designed for Oracle Free Tier environments where database pausing may occur.</p>
 */
@RestController
@RequestMapping("/api/health")
public class HealthCheckController {

    private static final Logger log = LoggerFactory.getLogger(HealthCheckController.class);
    private static final Map<String, String> UP = Map.of("status", "UP");
    private static final Map<String, String> DOWN = Map.of("status", "DOWN");

    private final DataSource dataSource;

    /**
     * Cached JDBC database product name (e.g. "Oracle", "H2").
     * Resolved once from connection metadata during a successful ping;
     * volatile because pings may run on different request threads.
     */
    private volatile String databaseProduct;

    public HealthCheckController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Basic health check for the frontend.
     *
     * @return {@code {"status":"ok","database":"ok"|"down","timestamp":<epochMillis>}},
     *         200 OK when database is up, 503 Service Unavailable when database is down
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        long now = System.currentTimeMillis();
        boolean dbUp = pingDatabase();
        Map<String, Object> body = new HashMap<>();
        body.put("status", "ok"); // application is up if this controller was reached
        body.put("database", dbUp ? "ok" : "down");
        // Real DB flavor from JDBC metadata; "unknown" until first successful ping.
        body.put("databaseProduct", databaseProduct != null ? databaseProduct : "unknown");
        body.put("timestamp", now);
        HttpStatus status = dbUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
        return new ResponseEntity<>(body, status);
    }

    /**
     * Deep database check with an Oracle-specific query on a fresh connection.
     *
     * <p>Stays public because it is the troubleshooting aid for the moments when login
     * is impossible: login provisions the user in this same database. Anonymous callers
     * therefore learn up or down and nothing else. An authenticated ADMIN also receives
     * the address the database sees for this service, which is what an Oracle access-list
     * fix needs. Failure details go to the log, never into the response.</p>
     *
     * @param authentication the caller, or {@code null} when anonymous
     * @return 200 {@code {"status":"UP"}} (plus {@code oracleSeesIp} for an ADMIN),
     *         503 {@code {"status":"DOWN"}} when the query fails
     */
    @GetMapping("/db")
    public ResponseEntity<Map<String, String>> checkDatabaseConnection(Authentication authentication) {
        try (
            Connection conn = dataSource.getConnection();
            // SYS_CONTEXT verifies actual Oracle functionality and returns client IP for diagnostics
            PreparedStatement stmt = conn.prepareStatement(
                    "SELECT SYS_CONTEXT('USERENV', 'IP_ADDRESS') AS ip FROM DUAL");
            ResultSet rs = stmt.executeQuery()
        ) {
            if (!rs.next()) {
                log.warn("Database health check returned no row");
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(DOWN);
            }
            return ResponseEntity.ok(isAdmin(authentication)
                    ? Map.of("status", "UP", "oracleSeesIp", String.valueOf(rs.getString("ip")))
                    : UP);
        } catch (Exception ex) {
            log.warn("Database health check failed", ex);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(DOWN);
        }
    }

    // low-cost ping; runs every 15 min from the frontend health check
    private boolean pingDatabase() {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT 1 FROM DUAL");
             ResultSet rs = stmt.executeQuery()) {
            resolveDatabaseProduct(conn);
            return rs.next();
        } catch (SQLException ex) {
            return false;
        }
    }

    /**
     * Resolves and caches the database product name from connection metadata.
     * Failures are swallowed (and not cached) so a metadata hiccup never
     * breaks the health ping; the next ping retries.
     */
    private void resolveDatabaseProduct(Connection conn) {
        if (databaseProduct != null) {
            return;
        }
        try {
            String name = conn.getMetaData().getDatabaseProductName();
            if (name != null && !name.isBlank()) {
                databaseProduct = name;
            }
        } catch (Exception ex) {
            // metadata unavailable; keep null and retry on a later ping
        }
    }

    private static boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }
}
