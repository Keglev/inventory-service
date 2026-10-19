package com.smartsupplypro.inventory.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Writes the short-lived cookies of the OAuth2 login flow: the authorization request
 * and the post-login return origin.
 *
 * <p>Both live for one login round trip and are read only by the server, so every one is
 * HttpOnly, Path=/ and SameSite=Lax (the callback from Google is a top-level GET navigation).
 * Secure follows the request scheme as seen through the proxy. The header is built by hand
 * because the servlet {@code Cookie} API has no SameSite attribute.</p>
 */
final class OAuthCookies {

    /** Post-login return origin, written on authorization and cleared on success. */
    static final String RETURN_COOKIE = "SSP_RETURN";

    private OAuthCookies() {}

    /**
     * Adds a Set-Cookie header for {@code name}.
     *
     * @param request       current request; decides the Secure flag
     * @param response      response receiving the header
     * @param name          cookie name
     * @param value         cookie value; empty to clear
     * @param maxAgeSeconds lifetime; 0 clears the cookie, a negative value omits Max-Age
     */
    static void write(HttpServletRequest request, HttpServletResponse response,
                      String name, String value, int maxAgeSeconds) {
        StringBuilder sb = new StringBuilder(name).append('=').append(value).append("; Path=/");
        if (maxAgeSeconds >= 0) sb.append("; Max-Age=").append(maxAgeSeconds);
        if (isHttps(request)) sb.append("; Secure");
        sb.append("; HttpOnly; SameSite=Lax");
        response.addHeader("Set-Cookie", sb.toString());
    }

    /**
     * Returns whether the browser reached us over HTTPS. TLS ends at the reverse proxy, so the
     * forwarded scheme counts as well as the connection's own.
     *
     * @param request current request
     * @return true for a secure connection or {@code X-Forwarded-Proto: https}
     */
    static boolean isHttps(HttpServletRequest request) {
        if (request.isSecure()) return true;
        String xfProto = request.getHeader("X-Forwarded-Proto");
        return xfProto != null && xfProto.equalsIgnoreCase("https");
    }
}
