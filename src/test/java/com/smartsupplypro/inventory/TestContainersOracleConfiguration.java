package com.smartsupplypro.inventory;

import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Conditional;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.oracle.OracleContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Testcontainers configuration for running Oracle DB during integration tests.
 * <p>
 * This configuration is conditionally enabled when:
 * <ul>
 *   <li>The system property {@code -Dtestcontainers.enabled=true} is set</li>
 *   <li>Docker is available on the host machine</li>
 * </ul>
 */
@TestConfiguration(proxyBeanMethods = false)
@EnabledIfSystemProperty(named = "testcontainers.enabled", matches = "true")
public class TestContainersOracleConfiguration {

    /**
     * Defines a reusable Oracle container if Docker is available and enabled.
     *
     * @return a configured OracleContainer instance
     */
    @Bean
    @ServiceConnection
    @Conditional(EnableTestcontainersCondition.class)
    public OracleContainer oracleFreeContainer() {
        if (!DockerClientFactory.instance().isDockerAvailable()) {
            throw new IllegalStateException("Docker is not available. OracleContainer startup skipped.");
        }

        return new OracleContainer(DockerImageName.parse("gvenzl/oracle-free:latest"));
    }
}

