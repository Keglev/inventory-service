package com.smartsupplypro.inventory.service;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Shared fixture for {@link CustomOAuth2UserService} and {@link CustomOidcUserService} unit tests.
 */
final class CustomUserServiceTestSupport {

    private CustomUserServiceTestSupport() {}

    static OAuth2User oauth2UserWithAttributes(Map<String, Object> attributes) {
        return new OAuth2User() {
            @Override public Map<String, Object> getAttributes() { return attributes; }

            @Override
            public java.util.Collection<? extends GrantedAuthority> getAuthorities() {
                return Collections.singletonList(new SimpleGrantedAuthority("ROLE_OAUTH"));
            }

            @Override
            public String getName() {
                Object email = attributes.get("email");
                return email == null ? "unknown" : email.toString();
            }
        };
    }

    static OidcUser upstreamOidcUser(String email, String fullName) {
        java.util.Map<String, Object> claims = new java.util.LinkedHashMap<>();
        claims.put("sub", "sub-1");
        claims.put("email", email);
        if (fullName != null) claims.put("name", fullName);

        OidcIdToken idToken = new OidcIdToken(
                "dummy-token",
                Instant.now().minusSeconds(5),
                Instant.now().plusSeconds(3600),
                claims);

        return new DefaultOidcUser(
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_OIDC")),
                idToken,
                new OidcUserInfo(claims),
                "email");
    }

    static CustomOAuth2UserService oauth2Service(AppUserRepository repo, OAuth2User upstream, boolean isAdmin) {
        return new CustomOAuth2UserService(new UserProvisioningService(repo)) {
            @Override protected OAuth2User loadFromProvider(OAuth2UserRequest request) { return upstream; }
            @Override protected boolean isAdminEmail(String email) { return isAdmin; }
        };
    }

    static CustomOidcUserService oidcService(AppUserRepository repo, OidcUser upstream, boolean isAdmin) {
        return new CustomOidcUserService(new UserProvisioningService(repo)) {
            @Override protected OidcUser loadFromProvider(OidcUserRequest request) { return upstream; }
            @Override protected boolean isAdminEmail(String email) { return isAdmin; }
        };
    }

    static String oauth2RoleAuthority(String roleName) throws Exception {
        var m = CustomOAuth2UserService.class.getDeclaredMethod("toRoleAuthority", String.class);
        m.setAccessible(true);
        return (String) m.invoke(null, roleName);
    }

    static String oidcRoleAuthority(com.smartsupplypro.inventory.model.Role role) throws Exception {
        var m = CustomOidcUserService.class.getDeclaredMethod("toRoleAuthority",
                com.smartsupplypro.inventory.model.Role.class);
        m.setAccessible(true);
        return (String) m.invoke(null, role);
    }
}
