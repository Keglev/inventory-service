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
 * <p>Active profiles: {@code dev} (detailed logging),
 * {@code test} (H2 in-memory), {@code prod} (Oracle Cloud).</p>
 *
 * @see <a href="https://github.com/Keglev/inventory-service">GitHub Repository</a>
 * @see <a href="https://keglev.github.io/inventory-service/api.html">API Documentation</a>
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
