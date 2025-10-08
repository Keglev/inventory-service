package com.smartsupplypro.inventory.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * SpEL integration bridge for security expressions.
 * 
 * <p>Exposes AppProperties under named bean for method-level security expressions.
 * Enables conditional authorization using {@code @appProperties.demoReadonly} in
 * {@code @PreAuthorize} annotations.</p>
 * 
 * <p><strong>Enterprise Pattern:</strong> Bridges configuration properties into SpEL context
 * for declarative security rules without coupling security logic to business logic.</p>
 */
@Configuration
public class SecuritySpelBridgeConfig {

    /**
     * Primary AppProperties bean with named alias for SpEL expressions.
     * 
     * <p>Creates {@code @Primary} bean accessible as both {@code AppProperties} type
     * and {@code "appProperties"} name for method security SpEL integration.</p>
     */
    @Bean("appProperties")
    @Primary
    public AppProperties appPropertiesPrimary(AppProperties props) {
        return props; // same managed instance, just an alias name
    }
}

