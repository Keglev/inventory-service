package com.smartsupplypro.inventory;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class InventoryServiceApplicationTests {

	@Test
	void contextLoads() {
		// This test checks if Spring Boot context loads properly
        // Disabled in CI to avoid Oracle context load failure
		// Assumptions.assumeTrue(
        //     DockerClientFactory.instance().isDockerAvailable(),
        //    "Skipping context load test because Docker is not available"
       // );
	}

}
