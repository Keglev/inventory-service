package com.smartsupplypro.inventory;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.lang.NonNull;

public class EnableTestcontainersCondition implements Condition {

    @Override
    public boolean matches(@NonNull ConditionContext context, @NonNull AnnotatedTypeMetadata metadata) {
        String enabled = context.getEnvironment().getProperty("testcontainers.enabled", "false");
        return enabled.equalsIgnoreCase("true");
    }
}
