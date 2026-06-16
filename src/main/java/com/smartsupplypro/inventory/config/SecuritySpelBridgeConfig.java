package com.smartsupplypro.inventory.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Exposes {@link AppProperties} under the bean name {@code "appProperties"} so that
 * {@code @PreAuthorize("@appProperties.demoReadonly")} SpEL expressions resolve correctly.
 * Without an explicit name, Spring's default naming would not match the SpEL reference.
 */
@Configuration
public class SecuritySpelBridgeConfig {

    @Bean("appProperties")
    @Primary
    public AppProperties appPropertiesPrimary(AppProperties props) {
        return props;
    }
}
