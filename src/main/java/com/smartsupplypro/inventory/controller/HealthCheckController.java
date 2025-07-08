package com.smartsupplypro.inventory.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * Health check controller for verifying Oracle database availability.
 *
 * <p>This endpoint is particularly important in environments like Oracle Free Tier,
 * where the database can be paused after inactivity. A periodic HTTP ping
 * to this endpoint can keep the connection alive and ensure faster cold starts.
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
     * @return HTTP 200 with a JSON response if database is reachable;
     *         HTTP 503 with error info otherwise.
     */
    @GetMapping("/db")
    public ResponseEntity<String> checkDatabaseConnection() {
        try (
            // Open a connection from the pool
            Connection conn = dataSource.getConnection();

            // Oracle-specific dummy query to test DB availability
            PreparedStatement stmt = conn.prepareStatement("SELECT 1 FROM DUAL");

            // Execute query
            ResultSet rs = stmt.executeQuery()
        ) {
            if (rs.next()) {
                // Query succeeded — DB is reachable
                return ResponseEntity.ok("{\"status\": \"UP\", \"db\": \"reachable\"}");
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
