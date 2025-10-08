package com.smartsupplypro.inventory.controller;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health check controller for application and database status monitoring.
 *
 * <p>Provides lightweight and deep health checks for monitoring systems.
 * Particularly useful for Oracle Free Tier environments where database pausing occurs.</p>
 *
 * @see <a href="file:../../../../../../docs/architecture/patterns/controller-patterns.md">Controller Patterns</a>
 */
@RestController
@RequestMapping("/health")
public class HealthCheckController {

    @Autowired
    private DataSource dataSource;

    /**
     * Performs a low-cost health check by running "SELECT 1 FROM DUAL".
     *
     * <p>This query confirms:
     * <ul>
     *     <li>Connection pool is active</li>
     *     <li>Oracle database is reachable</li>
     *     <li>Basic query execution works</li>
     * </ul>
     *

    /**
     * Basic application health check.
     *
     * @return 200 OK if application is running
     */
    @GetMapping
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
    /**
     * Deep database health check with Oracle-specific query.
     *
     * @return 200 OK with client IP if database accessible, 503 if database down
     */
    @GetMapping("/db")
    public ResponseEntity<String> checkDatabaseConnection() {
        try (
            Connection conn = dataSource.getConnection();

            // Enterprise Comment: Oracle Health Check Strategy
            // Use SYS_CONTEXT query instead of simple SELECT 1 FROM DUAL
            // to verify actual Oracle functionality and return diagnostic info
            PreparedStatement stmt = conn.prepareStatement("SELECT SYS_CONTEXT('USERENV', 'IP_ADDRESS') As ip FROM DUAL");

            ResultSet rs = stmt.executeQuery()
        ) {
            if (rs.next()) {
                String ip = rs.getString("ip");
                // Query succeeded — DB is reachable
                return ResponseEntity.ok("{\"status\": \"UP\", \"oracleSeesIp\": \"" + ip + "\"}");
            } else {
                // Query returned no result — unusual but possible
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body("{\"status\": \"DOWN\", \"db\": \"query failed\"}");
            }
        } catch (Exception ex) {
            // DB unreachable or misconfigured
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("{\"status\": \"DOWN\", \"error\": \"" + ex.getMessage() + "\"}");
        }
    }
}
