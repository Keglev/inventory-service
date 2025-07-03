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
 * Controller for exposing a health check endpoint that verifies
 * the availability of the Oracle database.
 *
 * This is especially important for Oracle Free Tier accounts,
 * which may suspend or reset inactive databases.
 */
@RestController
@RequestMapping("/health")
public class HealthCheckController {

    @Autowired
    private DataSource dataSource;

    /**
     * Performs a simple health check by executing a "SELECT 1 FROM DUAL" query
     * to confirm that the Oracle DB connection is active and reachable.
     *
     * @return HTTP 200 if database is reachable, otherwise HTTP 503 with error details.
     */
    @GetMapping("/db")
    public ResponseEntity<String> checkDatabaseConnection() {
        try (
            Connection conn = dataSource.getConnection();                          // Opens a DB connection using injected datasource
            PreparedStatement stmt = conn.prepareStatement("SELECT 1 FROM DUAL");  // Oracle-specific dummy query
            ResultSet rs = stmt.executeQuery()
        ) {
            if (rs.next()) {
                // Query succeeded — DB is reachable
                return ResponseEntity.ok("{\"status\": \"UP\", \"db\": \"reachable\"}");
            } else {
                // Query returned no result — unexpected
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body("{\"status\": \"DOWN\", \"db\": \"query failed\"}");
            }
        } catch (Exception ex) {
            // Exception thrown — connection or execution failed
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("{\"status\": \"DOWN\", \"error\": \"" + ex.getMessage() + "\"}");
        }
    }
}