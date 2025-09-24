package com.smartsupplypro.inventory.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Exposes AppProperties under a stable bean name "appProperties"
 * so SpEL like {@code @appProperties.demoReadonly} evaluates reliably.
 */
@Configuration
public class SecuritySpelBridgeConfig {

    @Bean("appProperties")
    public AppProperties appPropertiesAlias(AppProperties props) {
        return props; // same managed instance, just an alias name
    }
}

