package com.smartsupplypro.inventory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application class for the SmartSupplyPro Inventory Service microservice.
 * 
 * <p>This Spring Boot application provides a RESTful API for managing inventory items,
 * suppliers, stock history, and analytics. It integrates with Oracle Autonomous Database
 * using wallet-based authentication and implements Google OAuth2 for secure user access.</p>
 * 
 * <h2>Key Features</h2>
 * <ul>
 *   <li><strong>Inventory Management:</strong> CRUD operations for inventory items with stock tracking</li>
 *   <li><strong>Supplier Management:</strong> Supplier database with relationship to inventory items</li>
 *   <li><strong>Stock History:</strong> Complete audit trail of all quantity and price changes</li>
 *   <li><strong>Analytics:</strong> Business insights including stock value, movement trends, and alerts</li>
 *   <li><strong>OAuth2 Security:</strong> Google-based authentication with role-based access control</li>
 * </ul>
 * 
 * <h2>Oracle Wallet Configuration</h2>
 * <p>Oracle Wallet setup for database connectivity is handled externally by the deployment
 * infrastructure (<code>start.sh</code> in Docker, Fly.io secrets) to maintain separation
 * of concerns and improve security.</p>
 * 
 * <p><strong>Why No Wallet Configuration in Java Code:</strong></p>
 * <ul>
 *   <li><strong>Security:</strong> Prevents logging of sensitive paths or configuration details</li>
 *   <li><strong>Separation of Concerns:</strong> Infrastructure concerns handled by deployment layer</li>
 *   <li><strong>Simplicity:</strong> start.sh sets JVM system properties before app starts:
 *       <pre>-Doracle.net.tns_admin=/app/wallet/Wallet_sspdb_fixed
 *-Doracle.net.wallet_password=${ORACLE_WALLET_PASSWORD}</pre>
 *   </li>
 *   <li><strong>Memory Safety:</strong> start.sh clears sensitive env vars after setting JVM properties</li>
 * </ul>
 * 
 * <h2>Deployment Profiles</h2>
 * <ul>
 *   <li><strong>dev:</strong> Local development with detailed logging</li>
 *   <li><strong>test:</strong> Integration testing with H2 in-memory database (no Oracle wallet needed)</li>
 *   <li><strong>prod:</strong> Production deployment with minimal logging and Oracle Cloud DB</li>
 * </ul>
 * 
 * <h2>Architecture</h2>
 * <p>This application follows enterprise-level patterns:</p>
 * <ul>
 *   <li><strong>Layered Architecture:</strong> Controller → Service → Repository</li>
 *   <li><strong>DTO Pattern:</strong> Separate API contracts from domain models</li>
 *   <li><strong>Validation Layer:</strong> Business rule enforcement before persistence</li>
 *   <li><strong>Security Layer:</strong> OAuth2 + role-based access control</li>
 *   <li><strong>Audit Trail:</strong> Complete stock history for compliance</li>
 * </ul>
 * 
 * @author SmartSupplyPro Team
 * @version 1.0.0
 * @since 1.0.0
 * @see <a href="https://github.com/Keglev/inventory-service">GitHub Repository</a>
 * @see <a href="https://keglev.github.io/inventory-service/api.html">API Documentation</a>
 * @see <a href="https://keglev.github.io/inventory-service/backend/coverage/index.html">Test Coverage</a>
 */
@SpringBootApplication
public class InventoryServiceApplication {

    /**
     * Main entry point for the Inventory Service application.
     * 
     * <p>Bootstraps the Spring Boot application context with all configured components.
     * No explicit configuration is needed here as all environment-specific setup
     * (database, security, logging) is handled through Spring profiles and external
     * configuration.</p>
     * 
     * <p><strong>Oracle Wallet Configuration:</strong> Handled by <code>start.sh</code>
     * before JVM startup. The shell script:</p>
     * <ol>
     *   <li>Decodes wallet from base64-encoded Fly.io secret</li>
     *   <li>Extracts wallet files to <code>/app/wallet/</code></li>
     *   <li>Sets JVM system properties for Oracle JDBC driver</li>
     *   <li>Clears sensitive environment variables</li>
     *   <li>Launches application with clean environment</li>
     * </ol>
     * 
     * <p><strong>Why This Approach:</strong></p>
     * <ul>
     *   <li>Oracle JDBC reads system properties before Spring initializes</li>
     *   <li>Reduces attack surface by not exposing config in Java code</li>
     *   <li>Improves testability (tests use H2, don't need wallet)</li>
     *   <li>Follows 12-factor app principles (config via environment)</li>
     * </ul>
     *
     * @param args command-line arguments (typically empty in containerized deployments)
     */
    public static void main(String[] args) {
        SpringApplication.run(InventoryServiceApplication.class, args);
    }
}
