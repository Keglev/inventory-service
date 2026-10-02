package com.smartsupplypro.inventory.security;

import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;

/**
 * Rejects every OAuth2 login that is not OpenID Connect.
 *
 * <p>Login runs through {@code CustomOidcUserService}, which applies the e-mail
 * allow-list and provisions the account. Spring uses this plain-OAuth2 service only
 * when a login carries no {@code openid} scope; without it, Spring's default service
 * would sign the user in with no allow-list check. Failing closed keeps a future scope
 * change from opening the login to any Google account.</p>
 */
public final class OidcOnlyUserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    /** OAuth2 error code reported for a login without the {@code openid} scope. */
    public static final String ERROR_CODE = "oidc_required";

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) {
        throw new OAuth2AuthenticationException(
                new OAuth2Error(ERROR_CODE, "Only OpenID Connect sign-in is supported", null));
    }
}
