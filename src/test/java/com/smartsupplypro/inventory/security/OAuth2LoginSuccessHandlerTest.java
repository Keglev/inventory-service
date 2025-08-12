package com.smartsupplypro.inventory.security;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static java.util.Collections.singletonList;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link OAuth2LoginSuccessHandler}.
 *
 * <p><b>Scope</b>
 * <ul>
 *   <li>New-user creation on first OAuth2 login.</li>
 *   <li>No duplicate persistence when the user already exists.</li>
 *   <li>Duplicate race handling via {@link DataIntegrityViolationException} fallback.</li>
 *   <li>Validation of mandatory attributes (email, name).</li>
 *   <li>Redirect target behavior post authentication.</li>
 * </ul>
 *
 * <p><b>Notes</b>
 * <ul>
 *   <li>These are pure unit tests using Mockito; no Spring context is required.</li>
 *   <li>Redirect URL is currently hardcoded in the handler and asserted as such.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class OAuth2LoginSuccessHandlerTest {

    @InjectMocks
    OAuth2LoginSuccessHandler handler;

    @Mock
    AppUserRepository userRepository;

    /**
     * Builds an {@link OAuth2AuthenticationToken} with the given attributes.
     *
     * <p><b>Given</b> an email and name<br>
     * <b>When</b> constructing the OAuth2 principal and token<br>
     * <b>Then</b> the token contains ROLE_USER authority and attributes keyed by "email" and "name".
     *
     * @param email email attribute for the OAuth2 principal
     * @param name  name attribute for the OAuth2 principal
     * @return authentication token suitable for invoking the success handler
     */
    private static OAuth2AuthenticationToken token(String email, String name) {
        OAuth2User principal = new DefaultOAuth2User(
            singletonList(() -> "ROLE_USER"),
            Map.of("email", email, "name", name),
            "email"
        );
        return new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");
    }

    /**
     * Verifies first-login onboarding persists a new {@link AppUser} with {@link Role#USER}
     * and issues a redirect to the frontend.
     *
     * <p><b>Given</b> a user email that does not exist in the repository<br>
     * <b>When</b> the success handler runs<br>
     * <b>Then</b> a new user is saved with role USER and a non-null creation timestamp, and
     * a redirect is sent to the expected landing page.
     */
    @Test
    @DisplayName("Creates new user with ROLE_USER and redirects")
    void createsNewUser() throws Exception {
        String email = "new@example.com";
        when(userRepository.findById(email)).thenReturn(Optional.empty());

        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();

        handler.onAuthenticationSuccess(req, res, token(email, "New User"));

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(captor.capture());
        AppUser saved = captor.getValue();

        assertThat(saved.getEmail()).isEqualTo(email);
        assertThat(saved.getRole()).isEqualTo(Role.USER);
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getCreatedAt()).isBeforeOrEqualTo(LocalDateTime.now());

        // Hardcoded redirect in handler (consider externalizing later).
        assertThat(res.getRedirectedUrl()).isEqualTo("https://localhost:5173/login");
    }

    /**
     * Ensures existing users are not duplicated and the flow still redirects.
     *
     * <p><b>Given</b> a user email that already exists<br>
     * <b>When</b> the success handler runs<br>
     * <b>Then</b> no new save occurs and a redirect is still issued.
     */
    @Test
    @DisplayName("Existing user: no duplicate save, still redirects")
    void existingUserNoDuplicate() throws Exception {
        String email = "exists@example.com";
        when(userRepository.findById(email)).thenReturn(Optional.of(new AppUser(email, "Exists")));

        MockHttpServletResponse res = new MockHttpServletResponse();
        handler.onAuthenticationSuccess(new MockHttpServletRequest(), res, token(email, "Exists"));

        verify(userRepository, never()).save(any());
        assertThat(res.getRedirectedUrl()).isEqualTo("https://localhost:5173/login");
    }

    /**
     * Validates duplicate-insert race handling via DB unique constraint.
     *
     * <p><b>Given</b> a repository that throws {@link DataIntegrityViolationException} on save<br>
     * <b>When</b> a first-time login triggers a save<br>
     * <b>Then</b> the handler performs a defensive {@code findByEmail} fallback and still redirects.
     */
    @Test
    @DisplayName("Duplicate race: DataIntegrityViolation handled via findByEmail fallback")
    void duplicateRaceHandled() throws Exception {
        String email = "race@example.com";
        when(userRepository.findById(email)).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenThrow(new DataIntegrityViolationException("dup"));
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(new AppUser(email, "Race")));

        MockHttpServletResponse res = new MockHttpServletResponse();
        handler.onAuthenticationSuccess(new MockHttpServletRequest(), res, token(email, "Race"));

        verify(userRepository).findByEmail(email);
        assertThat(res.getRedirectedUrl()).isEqualTo("https://localhost:5173/login");
    }

    /**
     * Ensures the handler fails fast when the OAuth2 provider does not supply an email.
     *
     * <p><b>Given</b> a token without the "email" attribute<br>
     * <b>When</b> the handler executes<br>
     * <b>Then</b> an {@link IllegalStateException} is thrown.
     */
    @Test
    @DisplayName("Missing email -> IllegalStateException")
    void missingEmailThrows() {
        OAuth2User principal = new DefaultOAuth2User(
            singletonList(() -> "ROLE_USER"),
            Map.of("name", "No Email"),
            "name"
        );
        OAuth2AuthenticationToken t = new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");

        assertThrows(IllegalStateException.class, () ->
            handler.onAuthenticationSuccess(new MockHttpServletRequest(), new MockHttpServletResponse(), t));
    }

    /**
     * Ensures the handler fails fast when the OAuth2 provider does not supply a display name.
     *
     * <p><b>Given</b> a token without the "name" attribute<br>
     * <b>When</b> the handler executes<br>
     * <b>Then</b> an {@link IllegalStateException} is thrown.
     */
    @Test
    @DisplayName("Missing name -> IllegalStateException")
    void missingNameThrows() {
        OAuth2User principal = new DefaultOAuth2User(
            singletonList(() -> "ROLE_USER"),
            Map.of("email", "no-name@example.com"),
            "email"
        );
        OAuth2AuthenticationToken t = new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");

        assertThrows(IllegalStateException.class, () ->
            handler.onAuthenticationSuccess(new MockHttpServletRequest(), new MockHttpServletResponse(), t));
    }
}
