package com.smartsupplypro.inventory;

import java.util.Arrays;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.beans.factory.annotation.Value;

@SpringBootApplication
public class InventoryServiceApplication {
public static void main(String[] args) {
		

		System.setProperty("oracle.net.tns_admin", "C:/Users/carlo/Documents/githubprojects/inventory-service/oracle_wallet/wallet_sspdb_new");
		System.setProperty("oracle.net.wallet_password", "SecureTest2025"); // if required

		System.out.println(">>> TNS_ADMIN = " + System.getProperty("oracle.net.tns_admin"));
		SpringApplication.run(InventoryServiceApplication.class, args);
    }

	@Bean
	public CommandLineRunner logDbSettings(@Value("${spring.datasource.username}") String user,
                                       @Value("${spring.datasource.url}") String url) {
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
			String dbUser = System.getenv("DB_USER");
			String dbPass = System.getenv("DB_PASS");
			String googleClientId = System.getenv("GOOGLE_CLIENT_ID");

			System.out.println(">>>>> DB URL: " + (dbUrl != null ? dbUrl : "NOT_SET"));
			System.out.println(">>>>> DB USER: " + (dbUser != null ? dbUser : "NOT_SET"));
			System.out.println(">>>>> DB PASS: " + (dbPass != null ? "***" : "NOT_SET"));
			System.out.println(">>>>> GOOGLE CLIENT ID: " + (googleClientId != null ? googleClientId : "NOT_SET"));
			System.out.println("====================================");
		};
	}

}

