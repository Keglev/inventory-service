package com.smartsupplypro.inventory.security;

import java.io.IOException;
import java.time.LocalDateTime;
import static java.util.Collections.singletonList;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Unit tests for {@link OAuth2LoginSuccessHandler}.
 *
 * <h2>Scope</h2>
 * <ul>
 *   <li>First-login onboarding saves a new {@link AppUser} with {@link Role#USER}.</li>
 *   <li>Existing-user flow does not duplicate records.</li>
 *   <li>Duplicate-insert race handled via {@link DataIntegrityViolationException} fallback.</li>
 *   <li>Mandatory attribute validation (email, name) fails fast.</li>
 *   <li>Redirect target = {@code app.frontend.base-url + landing-path}.</li>
 * </ul>
 *
 * <h2>Design</h2>
 * <ul>
 *   <li>No Spring context (pure Mockito).</li>
 *   <li>We stub {@link AppProperties} only in tests that actually reach the redirect.
 *       This avoids Mockito’s UnnecessaryStubbingException on early-fail tests.</li>
 *   <li>We use a lenient response for redirect-asserting tests because some
 *       success handlers perform more than one redirect in the same call chain.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class OAuth2LoginSuccessHandlerTest {

    @InjectMocks
    OAuth2LoginSuccessHandler handler;

    @Mock
    AppUserRepository userRepository;

    @Mock
    AppProperties props;

    @Mock
    AppProperties.Frontend frontend;

    /** Utility: build an OAuth2 token with {email, name} and ROLE_USER authority. */
    private static OAuth2AuthenticationToken token(String email, String name) {
        OAuth2User principal = new DefaultOAuth2User(
            singletonList(() -> "ROLE_USER"),
            Map.of("email", email, "name", name),
            "email"
        );
        return new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");
    }

    /** Helper: stub the frontend redirect target only for tests that need it. */
    private void stubFrontend(String baseUrl, String landingPath) {
        when(props.getFrontend()).thenReturn(frontend);
        when(frontend.getBaseUrl()).thenReturn(baseUrl);
        when(frontend.getLandingPath()).thenReturn(landingPath);
    }

    /**
     * Custom response that ignores any subsequent redirect once committed.
     * <p>Some success handlers call a framework redirect (e.g., super.onAuthenticationSuccess)
     * and then perform their own redirect. Spring’s {@link MockHttpServletResponse} throws
     * for the second call; we relax that here to focus on the contract (redirect target).</p>
     */
    static class LenientRedirectResponse extends MockHttpServletResponse {
        @Override
        public void sendRedirect(String location) {
            if (isCommitted()) {
                // swallow subsequent redirects; first one remains recorded
                return;
            }
            try {
                super.sendRedirect(location);
            } catch (IOException ignored) {
                // Mock behaviour shouldn't propagate here in tests
            }
        }
    }

    /**
     * <b>GIVEN</b> a new email (not in repo),
     * <b>WHEN</b> the handler runs,
     * <b>THEN</b> it persists ROLE_USER and redirects to the configured landing page.
     */
    @Test
    @DisplayName("Creates new user with ROLE_USER and redirects")
    void createsNewUser() throws Exception {
        String email = "new@example.com";
        when(userRepository.findById(email)).thenReturn(Optional.empty());
        stubFrontend("https://localhost:8081", "/api/me");

        MockHttpServletResponse res = new LenientRedirectResponse();
        handler.onAuthenticationSuccess(new MockHttpServletRequest(), res, token(email, "New User"));

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(captor.capture());
        AppUser saved = captor.getValue();

        assertThat(saved.getEmail()).isEqualTo(email);
        assertThat(saved.getRole()).isEqualTo(Role.USER);
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getCreatedAt()).isBeforeOrEqualTo(LocalDateTime.now());

        assertThat(res.getRedirectedUrl()).isEqualTo("https://localhost:8081/api/me");
    }

    /**
     * <b>GIVEN</b> the user already exists,
     * <b>WHEN</b> the handler runs,
     * <b>THEN</b> no duplicate save and still redirects.
     */
    @Test
    @DisplayName("Existing user: no duplicate save, still redirects")
    void existingUserNoDuplicate() throws Exception {
        String email = "exists@example.com";
        when(userRepository.findById(email)).thenReturn(Optional.of(new AppUser(email, "Exists")));
        stubFrontend("https://localhost:8081", "/api/me");

        MockHttpServletResponse res = new LenientRedirectResponse();
        handler.onAuthenticationSuccess(new MockHttpServletRequest(), res, token(email, "Exists"));

        verify(userRepository, never()).save(any());
        assertThat(res.getRedirectedUrl()).isEqualTo("https://localhost:8081/api/me");
    }

    /**
     * <b>GIVEN</b> a first-time login and a DB unique-constraint race,
     * <b>WHEN</b> repository.save throws {@link DataIntegrityViolationException},
     * <b>THEN</b> the handler falls back to find-by-email and still redirects.
     */
    @Test
    @DisplayName("Duplicate race: DataIntegrityViolation handled via findByEmail fallback")
    void duplicateRaceHandled() throws Exception {
        String email = "race@example.com";
        when(userRepository.findById(email)).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenThrow(new DataIntegrityViolationException("dup"));
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(new AppUser(email, "Race")));
        stubFrontend("https://localhost:8081", "/api/me");

        MockHttpServletResponse res = new LenientRedirectResponse();
        handler.onAuthenticationSuccess(new MockHttpServletRequest(), res, token(email, "Race"));

        verify(userRepository).findByEmail(email);
        assertThat(res.getRedirectedUrl()).isEqualTo("https://localhost:8081/api/me");
    }

    /**
     * <b>GIVEN</b> a token without an email,
     * <b>THEN</b> the handler must fail fast (no properties stubbing here → no unnecessary stubs).
     */
    @Test
    @DisplayName("Missing email -> IllegalStateException")
    void missingEmailThrows() {
        OAuth2User principal = new DefaultOAuth2User(
            singletonList(() -> "ROLE_USER"),
            Map.of("name", "No Email"),
            "name"
        );
        OAuth2AuthenticationToken t =
            new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
            handler.onAuthenticationSuccess(new MockHttpServletRequest(), new MockHttpServletResponse(), t));

        assertThat(ex.getMessage()).isNotBlank();
    }

    /**
     * <b>GIVEN</b> a token without a display name,
     * <b>THEN</b> the handler must fail fast (again no props stubbing).
     */
    @Test
    @DisplayName("Missing name -> IllegalStateException")
    void missingNameThrows() {
        OAuth2User principal = new DefaultOAuth2User(
            singletonList(() -> "ROLE_USER"),
            Map.of("email", "no-name@example.com"),
            "email"
        );
        OAuth2AuthenticationToken t =
            new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
            handler.onAuthenticationSuccess(new MockHttpServletRequest(), new MockHttpServletResponse(), t));

        assertThat(ex.getMessage()).isNotBlank();
    }
}
