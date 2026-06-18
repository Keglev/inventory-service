package com.smartsupplypro.inventory.security.oauth2login;

import java.util.Map;

import static java.util.Collections.singletonList;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.security.OAuth2LoginSuccessHandler;
import com.smartsupplypro.inventory.service.UserProvisioningService;

/**
 * Unit tests for {@link OAuth2LoginSuccessHandler} provisioning delegation,
 * attribute validation, and duplicate-redirect guard.
 */
@ExtendWith(MockitoExtension.class)
class OAuth2LoginSuccessHandlerProvisioningTest {

    @InjectMocks
    OAuth2LoginSuccessHandler handler;

    @Mock
    AppProperties props;

    @Mock
    AppProperties.Frontend frontend;

    @Mock
    UserProvisioningService userProvisioningService;

    private void stubFrontend(String baseUrl, String landingPath) {
        when(props.getFrontend()).thenReturn(frontend);
        when(frontend.getBaseUrl()).thenReturn(baseUrl);
        when(frontend.getLandingPath()).thenReturn(landingPath);
    }

    /**
     * Behavior when authentication succeeds with valid principal attributes.
     */
    @Nested
    class WhenAuthenticationSucceeds {

        @Test
        void should_delegate_user_provisioning_to_service_on_login_success() throws Exception {
            stubFrontend("https://localhost:8081", "/api/me");
            MockHttpServletResponse res =
                    new OAuth2LoginSuccessHandlerTestSupport.LenientRedirectResponse();

            handler.onAuthenticationSuccess(new MockHttpServletRequest(), res,
                OAuth2LoginSuccessHandlerTestSupport.token("user@example.com", "User"));

            verify(userProvisioningService).provisionIfAbsent("user@example.com", "User");
            assertThat(res.getRedirectedUrl()).isEqualTo("https://localhost:8081/api/me");
        }

        @Test
        void should_skip_provisioning_and_redirect_when_success_guard_is_set() throws Exception {
            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setAttribute("OAUTH2_SUCCESS_REDIRECT_DONE", Boolean.TRUE);
            MockHttpServletResponse res = new MockHttpServletResponse();

            handler.onAuthenticationSuccess(req, res,
                OAuth2LoginSuccessHandlerTestSupport.token("skip@example.com", "Skip"));

            verify(userProvisioningService, never()).provisionIfAbsent(any(), any());
            assertThat(res.getRedirectedUrl()).isNull();
        }
    }

    /**
     * Behavior when required principal attributes are missing or provisioning throws.
     */
    @Nested
    class WhenProvisioningFails {

        @Test
        void should_propagate_exception_when_provisioning_service_throws() {
            doThrow(new IllegalStateException("cannot load"))
                .when(userProvisioningService).provisionIfAbsent(any(), any());

            assertThrows(IllegalStateException.class, () ->
                handler.onAuthenticationSuccess(new MockHttpServletRequest(), new MockHttpServletResponse(),
                    OAuth2LoginSuccessHandlerTestSupport.token("fail@example.com", "Fail")));
        }

        @Test
        void should_throw_before_provisioning_when_email_attribute_is_missing() {
            // DefaultOAuth2User requires a nameAttributeKey that exists in the attributes map.
            OAuth2User principal = new DefaultOAuth2User(
                singletonList(() -> "ROLE_USER"), Map.of("name", "No Email"), "name");
            OAuth2AuthenticationToken t = new OAuth2AuthenticationToken(
                principal, principal.getAuthorities(), "google");

            assertThrows(IllegalStateException.class, () ->
                handler.onAuthenticationSuccess(
                    new MockHttpServletRequest(), new MockHttpServletResponse(), t));
            verify(userProvisioningService, never()).provisionIfAbsent(any(), any());
        }

        @Test
        void should_throw_before_provisioning_when_name_attribute_is_missing() {
            // DefaultOAuth2User requires a nameAttributeKey that exists in the attributes map.
            OAuth2User principal = new DefaultOAuth2User(
                singletonList(() -> "ROLE_USER"), Map.of("email", "no-name@example.com"), "email");
            OAuth2AuthenticationToken t = new OAuth2AuthenticationToken(
                principal, principal.getAuthorities(), "google");

            assertThrows(IllegalStateException.class, () ->
                handler.onAuthenticationSuccess(
                    new MockHttpServletRequest(), new MockHttpServletResponse(), t));
            verify(userProvisioningService, never()).provisionIfAbsent(any(), any());
        }
    }
}
