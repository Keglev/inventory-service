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

@RestController
@RequestMapping("/health")
public class HealthCheckController {
    
     @Autowired
    private DataSource dataSource;

    @GetMapping("/db")
    public ResponseEntity<String> checkDatabaseConnection() {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT 1 FROM DUAL");
             ResultSet rs = stmt.executeQuery()) {

            if (rs.next()) {
                return ResponseEntity.ok("{\"status\": \"UP\", \"db\": \"reachable\"}");
            } else {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body("{\"status\": \"DOWN\", \"db\": \"query failed\"}");
            }

        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("{\"status\": \"DOWN\", \"error\": \"" + ex.getMessage() + "\"}");
        }
    }
}
