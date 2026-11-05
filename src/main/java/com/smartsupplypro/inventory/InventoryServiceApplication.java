package com.smartsupplypro.inventory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

/**
 * Entry point for the SmartSupplyPro Inventory Service.
 *
 * <p>Provides inventory management, supplier operations, stock history
 * audit trail, and analytics over an Oracle Autonomous Database with
 * wallet-based authentication and Google OAuth2 security.</p>
 *
 * <p>Oracle wallet configuration is handled by the deployment
 * infrastructure prior to JVM startup, following 12-factor
 * separation of configuration from code.</p>
 *
 * <p>Profiles: {@code prod} (Oracle Autonomous Database), {@code test} (H2 in
 * memory, Oracle mode), {@code e2e} (added to {@code test} for the Playwright run).</p>
 *
 * @see <a href="https://github.com/Keglev/inventory-service">GitHub Repository</a>
 * @see <a href="https://keglev.github.io/inventory-service/backend/api/index.html">API Documentation</a>
 */
@SpringBootApplication
public class InventoryServiceApplication {

    /**
    * Starts the application, delegating wallet setup to
    * the deployment infrastructure before JVM initialization.
    *
    * @param args command-line arguments
    */
    public static void main(String[] args) {
        run(args);
    }

    // --ssp.close=true closes the context once started: InventoryServiceApplicationMainTest
    // runs main() through this path without leaving the application running.
    static ConfigurableApplicationContext run(String[] args) {
        ConfigurableApplicationContext applicationContext = SpringApplication.run(InventoryServiceApplication.class, args);

        if (shouldCloseAfterStartup(args)) {
            applicationContext.close();
        }

        return applicationContext;
    }

    private static boolean shouldCloseAfterStartup(String[] args) {
        if (args == null || args.length == 0) {
            return false;
        }

        for (String arg : args) {
            if ("--ssp.close=true".equals(arg)) {
                return true;
            }
        }

        return false;
    }
}
