package com.smartsupplypro.inventory.config;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.PropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.ClassPathResource;

import com.zaxxer.hikari.HikariConfig;

/**
 * Pins how the production overlay hands the Oracle wallet password to the JDBC
 * driver: as a Hikari data-source property read from the environment, so the
 * password never has to appear on the JVM command line (ADR-0009 amendment).
 */
class WalletPasswordBindingTest {

    @Test
    void should_pass_the_wallet_password_from_the_environment_to_the_driver_when_prod_is_loaded()
            throws IOException {
        StandardEnvironment env = new StandardEnvironment();
        load(env, "application.yml");
        load(env, "application-prod.yml");
        env.getPropertySources().addFirst(new MapPropertySource("test-env",
                Map.of("ORACLE_WALLET_PASSWORD", "wallet-secret-from-env")));

        HikariConfig hikari = Binder.get(env)
                .bind("spring.datasource.hikari", Bindable.ofInstance(new HikariConfig()))
                .get();

        assertThat(hikari.getDataSourceProperties())
                .containsEntry("oracle.net.wallet_password", "wallet-secret-from-env");
    }

    private static void load(StandardEnvironment env, String file) throws IOException {
        for (PropertySource<?> source : new YamlPropertySourceLoader().load(file, new ClassPathResource(file))) {
            env.getPropertySources().addFirst(source);
        }
    }
}
