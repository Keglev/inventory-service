package com.smartsupplypro.inventory.controller;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

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
 * <p><strong>Endpoints:</strong></p>
 * <ul>
 *   <li>{@code GET /health} - Basic application health check (no database verification)</li>
 *   <li>{@code GET /health/db} - Deep health check with database connectivity verification</li>
 * </ul>
 *
 * @see <a href="file:../../../../../../docs/architecture/patterns/controller-patterns.md">Controller Patterns</a>
 */
@RestController
@RequestMapping("/health")
public class HealthCheckController {

    @Autowired
    private DataSource dataSource;

    /**
    * Basic JSON health check for the frontend.
    *
    * Returns:
    * {
    *   "status": "ok" | "down",
    *   "database": "ok" | "down",
    *   "timestamp": <epochMillis>
    * }
    */
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {

        long now = System.currentTimeMillis();
        boolean dbUp;

        // low-cost DB ping; runs every 15min from the frontend
        try (Connection conn = dataSource.getConnection();
            PreparedStatement stmt = conn.prepareStatement("SELECT 1 FROM DUAL");
            ResultSet rs = stmt.executeQuery()) {

            dbUp = rs.next();

        } catch (SQLException ex) {
            // DB unreachable or query failed
            dbUp = false;
            // optionally log here with your logger
            // log.warn("Database health check failed", ex);
        }
        Map<String, Object> body = new HashMap<>();
        // application is running if we reached this controller at all
        body.put("status", "ok");
        body.put("database", dbUp ? "ok" : "down");
        body.put("timestamp", now);

        HttpStatus status = dbUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
        return new ResponseEntity<>(body, status);
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

            // Oracle Health Check Strategy
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
