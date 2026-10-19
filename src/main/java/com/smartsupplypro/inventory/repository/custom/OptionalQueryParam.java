package com.smartsupplypro.inventory.repository.custom;

/**
 * Normalises optional filter values for the custom analytics repositories.
 *
 * <p>Their native SQL guards each optional filter with {@code :param IS NULL}; a blank value
 * bound as-is would filter for an empty or whitespace string and return nothing.
 */
final class OptionalQueryParam {

    private OptionalQueryParam() {}

    /**
     * Returns {@code null} for a null or blank value, otherwise the value trimmed.
     *
     * @param param raw filter value from the caller
     * @return the value to bind, or {@code null} to disable the filter
     */
    static String normalize(String param) {
        return (param == null || param.isBlank()) ? null : param.trim();
    }
}
