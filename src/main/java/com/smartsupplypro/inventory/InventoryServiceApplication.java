package com.smartsupplypro.inventory;

import java.util.Arrays;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.beans.factory.annotation.Value;

/**
 * Main application class for the Inventory Service microservice.
 * <p>
 * This entry point performs the following tasks:
 * <ul>
 *   <li>Bootstraps the Spring Boot application.</li>
 *   <li>Reads and applies Oracle Wallet system properties from environment variables.</li>
 *   <li>Logs essential environment variables and active Spring profiles for diagnostics (non-prod only).</li>
 * </ul>
 * 
 * @author Carlo
 * @since 1.0.0
 */
@SpringBootApplication
public class InventoryServiceApplication {

    private static final Logger logger = LoggerFactory.getLogger(InventoryServiceApplication.class);

    /**
     * Main method that launches the Inventory Service application.
     * It also sets Oracle Wallet properties based on environment variables.
     *
     * @param args Command-line arguments
     */
    public static void main(String[] args) {
        String tnsAdmin = System.getenv("TNS_ADMIN");
        String walletPassword = System.getenv("ORACLE_WALLET_PASSWORD");

        if (tnsAdmin != null) {
            System.setProperty("oracle.net.tns_admin", tnsAdmin);
            logger.info("TNS_ADMIN set.");
        } else {
            logger.warn("TNS_ADMIN environment variable not set.");
        }

        if (walletPassword != null) {
            System.setProperty("oracle.net.wallet_password", walletPassword);
            logger.info("Oracle Wallet password set.");
        } else {
            logger.warn("ORACLE_WALLET_PASSWORD environment variable not set.");
        }

        SpringApplication.run(InventoryServiceApplication.class, args);
    }

    /**
     * Logs database connection properties (excluding password) at startup.
     * Only intended for non-production diagnostics.
     *
     * @param user the database username
     * @param url  the database URL
     * @param env  the Spring environment
     * @return CommandLineRunner
     */
    @Bean
    public CommandLineRunner logDbSettings(
            @Value("${spring.datasource.username:NOT_SET}") String user,
            @Value("${spring.datasource.url:NOT_SET}") String url,
            Environment env) {
        return args -> {
            if (!env.acceptsProfiles(Profiles.of("prod"))) {
                logger.debug("Database username: {}", user);
                logger.debug("Database URL: {}", url);
            }
        };
    }

    /**
     * Logs active Spring profiles and environment information.
     * Avoids exposing secrets in production environments.
     *
     * @param env the Spring environment
     * @return CommandLineRunner
     */
    @Bean
    public CommandLineRunner logEnvironment(Environment env) {
        return args -> {
            logger.info("Active Spring profiles: {}", Arrays.toString(env.getActiveProfiles()));

            if (!env.acceptsProfiles(Profiles.of("prod"))) {
                String dbUrl = System.getenv("DB_URL");
                String dbUser = System.getenv("DB_USERNAME");
                String dbPass = System.getenv("DB_PASSWORD");
                String googleClientId = System.getenv("GOOGLE_CLIENT_ID");

                logger.debug("DB URL is set: {}", dbUrl != null);
                logger.debug("DB USER is set: {}", dbUser != null);
                logger.debug("DB PASS is set: {}", dbPass != null);
                logger.debug("GOOGLE CLIENT ID is set: {}", googleClientId != null);
            } else {
                logger.info("Production mode: environment variables not logged.");
            }
        };
    }
    @Bean
    public CommandLineRunner checkOAuthClientId(
        @Value("${GOOGLE_CLIENT_ID:NOT_SET}") String clientId,
        @Value("${GOOGLE_CLIENT_SECRET:NOT_SET}") String clientSecret
    ) {
        return args -> {
            System.out.println(">>> GOOGLE_CLIENT_ID: " + clientId);
            System.out.println(">>> GOOGLE_CLIENT_SECRET length: " + clientSecret.length());
        };
    }

}
