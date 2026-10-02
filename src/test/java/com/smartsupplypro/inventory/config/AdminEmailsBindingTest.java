package com.smartsupplypro.inventory.config;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.PropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.ClassPathResource;

/**
 * Pins how {@code APP_ADMIN_EMAILS} reaches {@link AppProperties#getAdminEmails()}
 * through {@code app.admin-emails} in application.yml.
 */
class AdminEmailsBindingTest {

    @Test
    void should_bind_every_comma_separated_address_when_the_variable_is_set() throws IOException {
        AppProperties props = bind(Map.of("APP_ADMIN_EMAILS", "me@example.com, Ops@Example.org"));

        assertThat(props.getAdminEmails()).containsExactly("me@example.com", "Ops@Example.org");
    }

    @Test
    void should_bind_an_empty_list_when_the_variable_is_unset() throws IOException {
        assertThat(bind(Map.of()).getAdminEmails()).isEmpty();
    }

    private static AppProperties bind(Map<String, Object> variables) throws IOException {
        StandardEnvironment env = new StandardEnvironment();
        env.getPropertySources().remove(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME);
        env.getPropertySources().addFirst(new MapPropertySource("variables", variables));
        for (PropertySource<?> source : new YamlPropertySourceLoader()
                .load("application.yml", new ClassPathResource("application.yml"))) {
            env.getPropertySources().addLast(source);
        }
        return Binder.get(env).bindOrCreate("app", AppProperties.class);
    }
}
