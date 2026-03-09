package com.smartsupplypro.inventory.security.oauth2;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import com.smartsupplypro.inventory.security.CookieOAuth2AuthorizationRequestRepository;

/**
 * Shared helper utilities for {@link CookieOAuth2AuthorizationRequestRepository} unit tests.
 *
 * <p><strong>Purpose</strong>:</p>
 * <ul>
 *   <li>Keep test classes small and focused by centralizing boilerplate (sample request creation, forwarded HTTPS
 *       request setup, cookie header parsing, base64url encode/decode).</li>
 *   <li>Ensure all tests use a consistent sample {@code OAuth2AuthorizationRequest} and cookie parsing logic,
 *       reducing maintenance cost when the repository format evolves.</li>
 * </ul>
 *
 * <p><strong>Design notes</strong>:</p>
 * <ul>
 *   <li>Package-private on purpose: used only by tests in this package.</li>
 *   <li>No assertions here: helpers should remain deterministic and side-effect free.</li>
 * </ul>
 */
final class CookieOAuth2AuthorizationRequestRepositoryTestSupport {

    static final String HEADER_SET_COOKIE = "Set-Cookie";
    static final String HEADER_X_FORWARDED_PROTO = "X-Forwarded-Proto";

    static final String AUTH_COOKIE = CookieOAuth2AuthorizationRequestRepository.AUTH_REQUEST_COOKIE_NAME;
    static final String RETURN_COOKIE = "SSP_RETURN";

    private CookieOAuth2AuthorizationRequestRepositoryTestSupport() {
    }

    static OAuth2AuthorizationRequest sampleAuthorizationRequest() {
        return OAuth2AuthorizationRequest.authorizationCode()
            .authorizationUri("https://accounts.example.test/oauth2/auth")
            .clientId("client-123")
            .redirectUri("https://app.example.test/login/oauth2/code/google")
            .scopes(Set.of("openid", "email"))
            .state("state-xyz")
            .additionalParameters(Map.of("prompt", "consent"))
            .attributes(attrs -> {
                attrs.put("nonce", "nonce-abc");
                attrs.put("tenant", "ssp");
            })
            .authorizationRequestUri("https://accounts.example.test/oauth2/auth?client_id=client-123")
            .build();
    }

    static MockHttpServletRequest forwardedHttpsRequest() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setSecure(false);
        req.addHeader(HEADER_X_FORWARDED_PROTO, "https");
        return req;
    }

    static String cookieValueFromSetCookieHeaders(List<String> setCookieHeaders, String cookieName) {
        String prefix = cookieName + "=";
        return setCookieHeaders.stream()
            .filter(h -> h != null && h.startsWith(prefix))
            .findFirst()
            .map(h -> {
                int start = prefix.length();
                int end = h.indexOf(';', start);
                return end >= 0 ? h.substring(start, end) : h.substring(start);
            })
            .orElse(null);
    }

    static String base64UrlEncodeUtf8(String raw) {
        return Base64.getUrlEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    static String base64UrlDecodeUtf8(String encoded) {
        return new String(Base64.getUrlDecoder().decode(encoded), StandardCharsets.UTF_8);
    }

    @SuppressWarnings("unused") // used reflectively by JUnit via @MethodSource(Class#method)
    static Stream<String> invalidAuthCookieValues() {
        return Stream.of(
            "%%%not-base64%%%",
            base64UrlEncodeUtf8("not-json")
        );
    }
}
