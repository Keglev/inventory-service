package com.smartsupplypro.inventory;

import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Conditional;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.oracle.OracleContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration(proxyBeanMethods = false)
@ActiveProfiles("test")
@EnabledIfSystemProperty(named = "testcontainers.enabled", matches = "true")
class TestcontainersConfiguration {

	@Bean
	@ServiceConnection
	@Conditional(EnableTestcontainersCondition.class)
    OracleContainer oracleFreeContainer() {
        if (!DockerClientFactory.instance().isDockerAvailable()) {
            throw new IllegalStateException("Docker is not available. Skipping OracleContainer startup.");
        }
        return new OracleContainer(DockerImageName.parse("gvenzl/oracle-free:latest"));
    }

}
