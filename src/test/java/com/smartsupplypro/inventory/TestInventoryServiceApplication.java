package com.smartsupplypro.inventory;

import org.springframework.boot.SpringApplication;
import org.springframework.test.context.ActiveProfiles;

// import com.smartsupplypro.inventory.InventoryServiceApplication; // Removed as the package does not exist

@ActiveProfiles("test")
public class TestInventoryServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(TestcontainersConfiguration.class, args); // Adjusted to remove reference to non-existent class
	}

}
