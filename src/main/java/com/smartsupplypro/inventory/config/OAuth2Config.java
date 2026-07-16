package com.smartsupplypro.inventory.config;

import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;

import com.smartsupplypro.inventory.security.CookieOAuth2AuthorizationRequestRepository;

/**
 * OAuth2 infrastructure beans shared by the security filter chain and login flows.
 *
 * <p>Separated from {@link SecurityConfig} so CORS, OAuth2, and the main chain
 * each live in their own class and stay within a readable size.</p>
 */
@Configuration
public class OAuth2Config {

    private final AppProperties props;

    public OAuth2Config(AppProperties props) {
        this.props = props;
    }

    /**
     * Redirects to the frontend login page on OAuth2 failure instead of surfacing
     * a raw error page to the user.
     */
    @Bean
    public AuthenticationFailureHandler oauthFailureHandler() {
        return (request, response, exception) -> {
            LoggerFactory.getLogger(OAuth2Config.class).warn("OAuth2 failure: {}", exception.toString());
            // Distinguish an allow-list rejection (access_denied) from a generic OAuth failure
            // so the frontend can show a specific "not authorized" message.
            String errorCode = "oauth";
            if (exception instanceof OAuth2AuthenticationException oae
                    && "access_denied".equals(oae.getError().getErrorCode())) {
                errorCode = "unauthorized";
            }
            String target = props.getFrontend().getBaseUrl() + "/login?error=" + errorCode;
            if (!response.isCommitted()) response.sendRedirect(target);
        };
    }

    /**
     * Persists OAuth2 authorization requests in a cookie so the stateless session
     * survives the provider redirect round-trip without server-side state.
     */
    @Bean
    public AuthorizationRequestRepository<OAuth2AuthorizationRequest> authorizationRequestRepository() {
        return new CookieOAuth2AuthorizationRequestRepository(props);
    }
}
