package com.smartsupplypro.inventory.service;

import java.time.Instant;
import java.util.Collections;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Shared fixture for {@link CustomOidcUserService} unit tests.
 */
final class CustomUserServiceTestSupport {

    private CustomUserServiceTestSupport() {}

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

    static CustomOidcUserService oidcService(AppUserRepository repo, OidcUser upstream, boolean isAdmin) {
        return new CustomOidcUserService(new UserProvisioningService(repo), new AppProperties()) {
            @Override protected OidcUser loadFromProvider(OidcUserRequest request) { return upstream; }
            @Override protected boolean isAdminEmail(String email) { return isAdmin; }
            @Override protected boolean isAllowedEmail(String email) { return true; }
        };
    }

    static CustomOidcUserService oidcServiceDenied(AppUserRepository repo, OidcUser upstream) {
        return new CustomOidcUserService(new UserProvisioningService(repo), new AppProperties()) {
            @Override protected OidcUser loadFromProvider(OidcUserRequest request) { return upstream; }
            @Override protected boolean isAdminEmail(String email) { return false; }
            @Override protected boolean isAllowedEmail(String email) { return false; }
        };
    }

    static String oidcRoleAuthority(com.smartsupplypro.inventory.model.Role role) throws Exception {
        var m = CustomOidcUserService.class.getDeclaredMethod("toRoleAuthority",
                com.smartsupplypro.inventory.model.Role.class);
        m.setAccessible(true);
        return (String) m.invoke(null, role);
    }
}
