package com.smartsupplypro.inventory.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Exposes AppProperties under bean name "appProperties" for SpEL and
 * makes it @Primary so type-based injection (e.g., in SuccessHandler)
 * chooses this one automatically.
 */
@Configuration
public class SecuritySpelBridgeConfig {

    @Bean("appProperties")
    @Primary
    public AppProperties appPropertiesPrimary(AppProperties props) {
        return props; // same managed instance, just an alias name
    }
}

