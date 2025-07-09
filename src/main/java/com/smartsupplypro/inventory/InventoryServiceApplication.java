package com.smartsupplypro.inventory;

import java.util.Arrays;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.beans.factory.annotation.Value;

/**
 * Main application class for the Inventory Service.
 * Initializes environment and logs key settings during startup.
 */
@SpringBootApplication
public class InventoryServiceApplication {

    public static void main(String[] args) {
        // Securely read Oracle Wallet environment settings
        String tnsAdmin = System.getenv("TNS_ADMIN");
        String walletPassword = System.getenv("ORACLE_WALLET_PASSWORD");

        if (tnsAdmin != null) {
            System.setProperty("oracle.net.tns_admin", tnsAdmin);
            System.out.println(">>> TNS_ADMIN set to: " + tnsAdmin);
        } else {
            System.err.println("WARNING: TNS_ADMIN environment variable not set.");
        }

        if (walletPassword != null) {
            System.setProperty("oracle.net.wallet_password", walletPassword);
            System.out.println(">>> Oracle Wallet password set.");
        } else {
            System.err.println("WARNING: ORACLE_WALLET_PASSWORD environment variable not set.");
        }

        SpringApplication.run(InventoryServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner logDbSettings(
            @Value("${spring.datasource.username:NOT_SET}") String user,
            @Value("${spring.datasource.url:NOT_SET}") String url) {
        return args -> {
            System.out.println(">>> DB_USER: " + user);
            System.out.println(">>> DB_URL: " + url);
        };
    }

    @Bean
    public CommandLineRunner logEnvironment(Environment env) {
        return args -> {
            System.out.println("====== SPRING BOOT DEBUG INFO ======");
            System.out.println(">>>>> ACTIVE PROFILE(S): " + Arrays.toString(env.getActiveProfiles()));

            String dbUrl = System.getenv("DB_URL");
            String dbUser = System.getenv("DB_USERNAME"); // updated for consistency
            String dbPass = System.getenv("DB_PASSWORD");
            String googleClientId = System.getenv("GOOGLE_CLIENT_ID");

            System.out.println(">>>>> DB URL: " + (dbUrl != null ? dbUrl : "NOT_SET"));
            System.out.println(">>>>> DB USER: " + (dbUser != null ? dbUser : "NOT_SET"));
            System.out.println(">>>>> DB PASS: " + (dbPass != null ? "***" : "NOT_SET"));
            System.out.println(">>>>> GOOGLE CLIENT ID: " + (googleClientId != null ? googleClientId : "NOT_SET"));
            System.out.println("====================================");
        };
    }
}
// This code initializes the Inventory Service application, sets up Oracle Wallet configurations,
// and logs important database and environment settings during startup.