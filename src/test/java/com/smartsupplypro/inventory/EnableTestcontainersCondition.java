package com.smartsupplypro.inventory;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.lang.NonNull;

/**
 * Custom Spring condition used to enable Testcontainers only when explicitly requested.
 * <p>
 * Checks the property {@code testcontainers.enabled=true} in the environment.
 */
public class EnableTestcontainersCondition implements Condition {

    /**
     * Returns {@code true} if the 'testcontainers.enabled' property is set to true.
     *
     * @param context the condition context
     * @param metadata metadata of the {@code @Conditional} annotation
     * @return true if testcontainers should be enabled
     */
    @Override
    public boolean matches(@NonNull ConditionContext context, @NonNull AnnotatedTypeMetadata metadata) {
        String enabled = context.getEnvironment().getProperty("testcontainers.enabled", "false");
        return enabled.equalsIgnoreCase("true");
    }
}
// This condition is used to control the activation of Testcontainers in the application context.