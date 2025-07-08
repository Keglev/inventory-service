package com.smartsupplypro.inventory.model;

/**
 * Enum representing user roles in the application.
 *
 * <p>Roles are used for authorization and access control via Spring Security.
 * They determine which endpoints a user can access and what actions are permitted.
 *
 * <ul>
 *   <li>{@code ADMIN} – Full access to create, update, and delete resources.</li>
 *   <li>{@code USER} – Read-only access to inventory and reporting features.</li>
 * </ul>
 *
 * <p>This enum is persisted in the database using {@code @Enumerated(EnumType.STRING)}
 * and may be mapped from string values provided by OAuth2 providers or UI input.
 */
public enum Role {
    ADMIN,
    USER;

    /**
     * Parses a string value (e.g., from DB or external input) into a {@link Role} enum.
     * Automatically trims whitespace and removes commas before resolving.
     *
     * @param value the raw role name as a string
     * @return corresponding {@link Role} enum value
     * @throws IllegalArgumentException if the input is invalid
     */
    public static Role fromString(String value) {
        return Role.valueOf(value.trim().replace(",", ""));
    }
}
// This enum is designed to be used in service layers where user roles are checked,
// such as in Spring Security configurations, user management services, and
// authorization logic. It provides a clear and type-safe way to represent roles,
// ensuring that only valid roles are used throughout the application. The
// `fromString` method allows for flexible parsing of role names from various
// sources, such as database records or user input, while maintaining robustness
// against common formatting issues like extra spaces or commas. This approach
// also allows for easy extension in the future if additional roles are needed,
// simply by adding new enum constants. The use of enums ensures that role
// management is consistent and type-safe, reducing the risk of errors from
// using raw strings or integers to represent roles. This is particularly useful
// in applications with complex access control requirements, where roles may
// need to be checked frequently in various parts of the codebase, such as
// controllers, services, and security configurations. The enum can also be
// easily serialized/deserialized in JSON or other formats, making it suitable
// for use in REST APIs or other communication protocols where roles need to be
// transmitted between client and server.