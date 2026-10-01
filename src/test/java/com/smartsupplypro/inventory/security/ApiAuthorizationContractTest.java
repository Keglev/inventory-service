package com.smartsupplypro.inventory.security;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Contract test: every production handler under {@code /api} declares its role rule with
 * {@code @PreAuthorize}. The URL layer only requires a sign-in, so a handler without one
 * would be open to any signed-in account. The allowlist names the handlers that are
 * public or identity-only by design.
 */
class ApiAuthorizationContractTest {

    private static final Set<String> WITHOUT_ROLE_RULE = Set.of(
        "GET /api/health",            // public liveness check
        "GET /api/health/db",         // public, answers up or down only
        "GET /api/me",                // the caller's own identity
        "GET /api/me/authorities",    // the caller's own roles
        "POST /api/auth/logout"       // ends the caller's own session
    );

    private record Handler(String key, boolean hasRule) {}

    private static List<Handler> apiHandlers() throws ClassNotFoundException {
        var scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));
        List<Handler> handlers = new ArrayList<>();
        for (BeanDefinition candidate : scanner.findCandidateComponents("com.smartsupplypro.inventory.controller")) {
            Class<?> type = Class.forName(candidate.getBeanClassName());
            RequestMapping typeMapping = AnnotatedElementUtils.findMergedAnnotation(type, RequestMapping.class);
            String prefix = typeMapping != null && typeMapping.path().length > 0 ? typeMapping.path()[0] : "";
            boolean typeRule = AnnotatedElementUtils.hasAnnotation(type, PreAuthorize.class);
            for (Method method : type.getDeclaredMethods()) {
                RequestMapping mapping = AnnotatedElementUtils.findMergedAnnotation(method, RequestMapping.class);
                if (mapping == null) continue;
                String verb = mapping.method().length > 0 ? mapping.method()[0].name() : "ANY";
                boolean rule = typeRule || AnnotatedElementUtils.hasAnnotation(method, PreAuthorize.class);
                for (String path : mapping.path().length > 0 ? mapping.path() : new String[] {""}) {
                    String full = prefix + path;
                    if (full.startsWith("/api")) handlers.add(new Handler(verb + " " + full, rule));
                }
            }
        }
        return handlers;
    }

    @Test
    void should_find_the_api_handlers_it_guards() throws Exception {
        assertTrue(apiHandlers().size() >= 40, "scan found too few handlers to be meaningful");
    }

    @Test
    void should_declare_a_role_rule_on_every_api_handler_outside_the_allowlist() throws Exception {
        List<String> missing = apiHandlers().stream()
            .filter(h -> !h.hasRule() && !WITHOUT_ROLE_RULE.contains(h.key()))
            .map(Handler::key).sorted().toList();
        assertEquals(List.of(), missing);
    }

    @Test
    void should_name_only_existing_handlers_in_the_allowlist() throws Exception {
        List<String> keys = apiHandlers().stream().map(Handler::key).toList();
        assertTrue(keys.containsAll(WITHOUT_ROLE_RULE), "allowlist names a handler that does not exist");
    }
}
