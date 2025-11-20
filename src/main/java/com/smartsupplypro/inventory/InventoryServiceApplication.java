package com.smartsupplypro.inventory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application class for the SmartSupplyPro Inventory Service.
 * 
 * <p><strong>Features</strong>: Inventory CRUD, supplier management, stock history audit trail, 
 * analytics insights, OAuth2 security with Google authentication.
 * 
 * <p><strong>Database</strong>: Oracle Autonomous Database with wallet-based authentication.
 * 
 * <p><strong>Security</strong>: Oracle wallet configuration handled by deployment infrastructure 
 * (scripts/start.sh) for security and separation of concerns.
 * 
 * <p><strong>Architecture</strong>: Layered (Controller → Service → Repository), DTO pattern, 
 * validation layer, audit trail.
 * 
 * <p><strong>Deployment</strong>: Profiles: dev (detailed logging), test (H2 in-memory), 
 * prod (minimal logging + Oracle Cloud).
 * 
 * @author SmartSupplyPro Team
 * @version 1.0.0
 * @see <a href="https://github.com/Keglev/inventory-service">GitHub Repository</a>
 * @see <a href="https://keglev.github.io/inventory-service/api.html">API Documentation</a>
 */
@SpringBootApplication
public class InventoryServiceApplication {

    /**
     * Main entry point for the Inventory Service application.
     * 
     * <p><strong>Oracle Wallet Setup</strong>: Handled by scripts/start.sh before JVM startup 
     * (decodes wallet, sets system properties, clears env vars).
     * 
     * <p><strong>Benefits</strong>: Security (no sensitive config in Java), testability 
     * (tests use H2), follows 12-factor app principles.
     *
     * @param args command-line arguments (typically empty in containerized deployments)
     */
    public static void main(String[] args) {
        SpringApplication.run(InventoryServiceApplication.class, args);
    }
}
