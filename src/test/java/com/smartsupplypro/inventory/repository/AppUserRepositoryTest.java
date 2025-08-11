package com.smartsupplypro.inventory.repository;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test class for {@link AppUserRepository} using an in-memory H2 database.
 * <p>
 * Verifies persistence operations related to application users authenticated via OAuth2,
 * including lookup by email, user count tracking, and entity storage.
 */
@DataJpaTest
@ActiveProfiles("test")
class AppUserRepositoryTest {

    @Autowired
    private AppUserRepository appUserRepository;

    /**
     * Helper method to create a sample AppUser entity.
     *
     * @param email the email to assign
     * @return a valid AppUser instance
     */
    private AppUser createUser(String email) {
        AppUser user = new AppUser(email, "Test User");
        user.setId("user-" + email.hashCode());
        user.setRole(Role.USER); // Enum required
        return user;
    }

    /**
     * Verifies that a new user can be saved and retrieved by email.
     */
    @Test
    @DisplayName("Should save and retrieve user by email")
    void testFindByEmail_successfulLookup() {
        // Arrange
        AppUser user = createUser("test@example.com");
        appUserRepository.save(user);

        // Act
        Optional<AppUser> result = appUserRepository.findByEmail("test@example.com");

        // Assert
        assertTrue(result.isPresent(), "Expected user to be found by email");
        assertEquals("test@example.com", result.get().getEmail());
    }

    /**
     * Verifies that an unknown email returns an empty Optional.
     */
    @Test
    @DisplayName("Should return empty when email is not found")
    void testFindByEmail_notFound() {
        Optional<AppUser> result = appUserRepository.findByEmail("unknown@example.com");
        assertTrue(result.isEmpty(), "Expected no user for unknown email");
    }

    /**
     * Verifies that count() reflects the correct number of saved users.
     */
    @Test
    @DisplayName("Should return correct user count after saving")
    void testCount_afterInsertions() {
        appUserRepository.save(createUser("a@example.com"));
        appUserRepository.save(createUser("b@example.com"));

        long count = appUserRepository.count();
        assertEquals(2, count, "Expected user count to match number of insertions");
    }

    /**
    * Verifies that saving two users with the same ID triggers a database constraint violation.
    * This ensures that the `email` field is treated as a unique primary key in the USERS_APP table.
    */
    @Test
    @DisplayName("Should throw exception when saving duplicate email")
    void testSave_duplicateEmail_throwsException() {
        // Save initial user
        AppUser user1 = new AppUser("duplicate@example.com", "Original User");
        user1.setRole(Role.USER);
        appUserRepository.saveAndFlush(user1);

        // Try saving another user with same email
        AppUser user2 = new AppUser("duplicate@example.com", "Other User");
        user2.setRole(Role.ADMIN);

        assertThrows(Exception.class, () -> {
            appUserRepository.saveAndFlush(user2);
        }, "Expected exception due to duplicate email");
    }

    /**
     * Verifies that the email field is treated as case-sensitive in lookups.
     */
    @Test
    @DisplayName("Should respect case sensitivity in email lookups")
    void testFindByEmail_caseSensitive() {
        appUserRepository.save(createUser("CaseSensitive@Example.com"));

        Optional<AppUser> lower = appUserRepository.findByEmail("casesensitive@example.com");
        Optional<AppUser> exact = appUserRepository.findByEmail("CaseSensitive@Example.com");

        assertTrue(lower.isEmpty(), "Expected case-sensitive email lookup to fail for lowercase");
        assertTrue(exact.isPresent(), "Expected exact case email to be found");
    }
}

