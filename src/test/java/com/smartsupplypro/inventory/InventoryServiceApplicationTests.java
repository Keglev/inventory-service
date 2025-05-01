package com.smartsupplypro.inventory;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.DockerClientFactory;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class InventoryServiceApplicationTests {

	@Test
	void contextLoads() {
		Assumptions.assumeTrue(
            DockerClientFactory.instance().isDockerAvailable(),
            "Skipping context load test because Docker is not available"
        );
	}

}
