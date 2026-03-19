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
 * Test support helpers for Custom OAuth/OIDC user services.
 *
 * <p><strong>Intent</strong>:
 * Keep unit tests short and deterministic by centralizing:
 * <ul>
 *   <li>Upstream principal stubs (OAuth2User / OidcUser)</li>
 *   <li>Service factories (override provider call + admin decision)</li>
 *   <li>Reflection access for private normalization helpers</li>
 * </ul>
 */
final class CustomUserServiceTestSupport {

    private CustomUserServiceTestSupport() {
        // utility class
    }

    static OAuth2User oauth2UserWithAttributes(Map<String, Object> attributes) {
        // Keep this stub permissive:
        // - DefaultOAuth2User enforces a nameAttributeKey.
        // - Our service must handle missing "email" (reject with exception).
        return new OAuth2User() {
            @Override
            public Map<String, Object> getAttributes() {
                return attributes;
            }

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
        // Minimal-but-realistic OIDC principal.
        Map<String, Object> claims = Map.of(
            "sub", "sub-1",
            "email", email,
            "name", fullName
        );

        OidcIdToken idToken = new OidcIdToken(
            "dummy-token",
            Instant.now().minusSeconds(5),
            Instant.now().plusSeconds(3600),
            claims
        );

        OidcUserInfo userInfo = new OidcUserInfo(claims);

        return new DefaultOidcUser(
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_OIDC")),
            idToken,
            userInfo,
            "email"
        );
    }

    static CustomOAuth2UserService oauth2Service(AppUserRepository repo, OAuth2User upstream, boolean isAdmin) {
        return new CustomOAuth2UserService(repo) {
            @Override
            protected OAuth2User loadFromProvider(OAuth2UserRequest request) {
                return upstream;
            }

            @Override
            protected boolean isAdminEmail(String email) {
                return isAdmin;
            }
        };
    }

    static CustomOidcUserService oidcService(AppUserRepository repo, OidcUser upstream, boolean isAdmin) {
        return new CustomOidcUserService(repo) {
            @Override
            protected OidcUser loadFromProvider(OidcUserRequest request) {
                return upstream;
            }

            @Override
            protected boolean isAdminEmail(String email) {
                return isAdmin;
            }
        };
    }

    static String oauth2RoleAuthority(String roleName) throws Exception {
        var m = CustomOAuth2UserService.class.getDeclaredMethod("toRoleAuthority", String.class);
        m.setAccessible(true);
        return (String) m.invoke(null, roleName);
    }

    static String oidcRoleAuthority(com.smartsupplypro.inventory.model.Role role) throws Exception {
        var m = CustomOidcUserService.class.getDeclaredMethod("toRoleAuthority", com.smartsupplypro.inventory.model.Role.class);
        m.setAccessible(true);
        return (String) m.invoke(null, role);
    }
}
