package com.smartsupplypro.inventory.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;

/** Unit test for {@link OidcOnlyUserService}: a plain OAuth2 login never signs in. */
class OidcOnlyUserServiceTest {

    @Test
    void should_reject_the_login_when_it_is_not_openid_connect() {
        OAuth2AuthenticationException ex = assertThrows(OAuth2AuthenticationException.class,
                () -> new OidcOnlyUserService().loadUser(mock(OAuth2UserRequest.class)));

        assertThat(ex.getError().getErrorCode()).isEqualTo(OidcOnlyUserService.ERROR_CODE);
    }
}
