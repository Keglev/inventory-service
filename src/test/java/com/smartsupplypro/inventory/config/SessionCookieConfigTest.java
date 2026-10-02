package com.smartsupplypro.inventory.config;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.boot.web.server.Cookie;
import org.springframework.boot.web.server.autoconfigure.ServerProperties;
import org.springframework.core.env.PropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.ClassPathResource;

/**
 * Pins the session cookie attributes the configuration files give the servlet
 * container, for the base file and with the production overlay on top.
 *
 * <p>{@code server.servlet.session.cookie} is the only source of these
 * attributes; Spring Session is not used.</p>
 */
class SessionCookieConfigTest {

    @ParameterizedTest
    @ValueSource(strings = {"application.yml", "application-prod.yml"})
    void should_bind_a_secure_same_site_lax_session_cookie_when_the_file_is_loaded(String overlay)
            throws IOException {
        StandardEnvironment env = new StandardEnvironment();
        load(env, "application.yml");
        load(env, overlay);

        Cookie cookie = Binder.get(env).bind("server", ServerProperties.class).get()
                .getServlet().getSession().getCookie();

        assertThat(cookie.getSecure()).isTrue();
        assertThat(cookie.getSameSite()).isEqualTo(Cookie.SameSite.LAX);
    }

    private static void load(StandardEnvironment env, String file) throws IOException {
        for (PropertySource<?> source : new YamlPropertySourceLoader().load(file, new ClassPathResource(file))) {
            env.getPropertySources().addFirst(source);
        }
    }
}
