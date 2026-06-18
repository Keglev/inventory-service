package com.smartsupplypro.inventory.repository;

import java.util.Optional;

import org.hibernate.exception.ConstraintViolationException;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

/**
 * Integration tests for {@link AppUserRepository} query correctness
 * using {@link org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest}.
 */
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class AppUserRepositoryTest {

    @Autowired
    private AppUserRepository appUserRepository;

    private AppUser createUser(String email) {
        AppUser user = new AppUser(email, "Test User");
        user.setId("user-" + email.hashCode());
        user.setRole(Role.USER);
        return user;
    }

    /**
     * Email-based lookup behavior and case sensitivity.
     */
    @Nested
    class EmailLookup {

        @Test
        void should_find_user_by_email_after_save() {
            appUserRepository.save(createUser("test@example.com"));

            Optional<AppUser> result = appUserRepository.findByEmail("test@example.com");

            assertTrue(result.isPresent());
            assertEquals("test@example.com", result.get().getEmail());
        }

        @Test
        void should_return_empty_when_email_not_found() {
            assertTrue(appUserRepository.findByEmail("unknown@example.com").isEmpty());
        }

        @Test
        void should_treat_email_lookup_as_case_sensitive() {
            appUserRepository.save(createUser("CaseSensitive@Example.com"));

            // H2 string comparison is case-sensitive for exact equality
            assertTrue(appUserRepository.findByEmail("casesensitive@example.com").isEmpty());
            assertTrue(appUserRepository.findByEmail("CaseSensitive@Example.com").isPresent());
        }
    }

    /**
     * Count accuracy after insertions.
     */
    @Nested
    class UserCount {

        @Test
        void should_reflect_correct_count_after_insertions() {
            appUserRepository.save(createUser("a@example.com"));
            appUserRepository.save(createUser("b@example.com"));

            assertEquals(2, appUserRepository.count());
        }
    }

    /**
     * Unique email constraint enforcement.
     */
    @Nested
    class ConstraintValidation {

        @Test
        void should_throw_on_duplicate_email() {
            AppUser user1 = new AppUser("duplicate@example.com", "Original User");
            user1.setRole(Role.USER);
            appUserRepository.saveAndFlush(user1);

            AppUser user2 = new AppUser("duplicate@example.com", "Other User");
            user2.setRole(Role.ADMIN);

            DataIntegrityViolationException ex = assertThrows(
                DataIntegrityViolationException.class,
                () -> appUserRepository.saveAndFlush(user2)
            );
            assertTrue(
                ex.getCause() instanceof ConstraintViolationException || ex.getMostSpecificCause() != null
            );
        }
    }
}
