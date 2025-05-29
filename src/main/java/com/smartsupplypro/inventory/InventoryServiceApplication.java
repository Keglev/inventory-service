package com.smartsupplypro.inventory;

import java.util.Arrays;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class InventoryServiceApplication {
public static void main(String[] args) {
        System.out.println(">>>>> ACTIVE PROFILE: " + System.getProperty("spring.profiles.active"));
        SpringApplication.run(InventoryServiceApplication.class, args);
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

