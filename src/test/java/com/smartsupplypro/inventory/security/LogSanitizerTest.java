package com.smartsupplypro.inventory.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link LogSanitizer}: line-breaking and control characters
 * are replaced, plain text is kept, and the length is bounded.
 */
class LogSanitizerTest {

    private static final char CR = 13;
    private static final char LF = 10;
    private static final char TAB = 9;
    private static final char NEL = 0x85;
    private static final char LINE_SEPARATOR = 0x2028;
    private static final char PARAGRAPH_SEPARATOR = 0x2029;

    @Test
    void should_replace_cr_and_lf_when_the_value_carries_line_breaks() {
        assertThat(LogSanitizer.sanitize("x" + CR + LF + "FORGED")).isEqualTo("x__FORGED");
    }

    @Test
    void should_replace_unicode_separators_and_other_controls_when_present() {
        String value = "a" + LINE_SEPARATOR + "b" + PARAGRAPH_SEPARATOR + "c" + TAB + "d" + NEL + "e";

        assertThat(LogSanitizer.sanitize(value)).isEqualTo("a_b_c_d_e");
    }

    @Test
    void should_keep_the_value_when_it_is_plain_text() {
        assertThat(LogSanitizer.sanitize("https://www.smartsupplypro.de"))
                .isEqualTo("https://www.smartsupplypro.de");
    }

    @Test
    void should_keep_the_value_whole_when_it_is_exactly_at_the_limit() {
        String value = "a".repeat(LogSanitizer.MAX_LENGTH);

        assertThat(LogSanitizer.sanitize(value)).isEqualTo(value);
    }

    @Test
    void should_cut_and_mark_the_value_when_it_is_longer_than_the_limit() {
        String value = "a".repeat(LogSanitizer.MAX_LENGTH + 1);

        assertThat(LogSanitizer.sanitize(value))
                .isEqualTo("a".repeat(LogSanitizer.MAX_LENGTH) + LogSanitizer.TRUNCATED);
    }

    @Test
    void should_return_null_when_the_value_is_null() {
        assertThat(LogSanitizer.sanitize(null)).isNull();
    }
}
