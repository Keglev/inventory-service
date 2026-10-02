package com.smartsupplypro.inventory.security;

/**
 * Makes request-derived text safe to place in a log line.
 *
 * <p>Every control character (CR, LF, tab, the C1 range with NEL) and the
 * Unicode line and paragraph separators become {@code _}, so a value can
 * neither start a forged log line nor split a real one (CWE-117). The value
 * is cut to {@link #MAX_LENGTH} characters so one request cannot write an
 * oversized line.</p>
 */
public final class LogSanitizer {

    /** Long enough for a framework error message, short enough to bound a line. */
    public static final int MAX_LENGTH = 500;

    /** Appended to a cut value so a reader knows the line is incomplete. */
    public static final String TRUNCATED = "...[truncated]";

    private static final char LINE_SEPARATOR = 0x2028;
    private static final char PARAGRAPH_SEPARATOR = 0x2029;

    private LogSanitizer() {}

    /**
     * Replaces unsafe characters and bounds the length.
     *
     * @param value request-derived text; {@code null} is returned unchanged
     * @return text that stays on one log line
     */
    public static String sanitize(String value) {
        if (value == null) return null;
        int end = Math.min(value.length(), MAX_LENGTH);
        StringBuilder out = new StringBuilder(end + TRUNCATED.length());
        for (int i = 0; i < end; i++) {
            char c = value.charAt(i);
            out.append(isUnsafe(c) ? '_' : c);
        }
        if (value.length() > MAX_LENGTH) out.append(TRUNCATED);
        return out.toString();
    }

    private static boolean isUnsafe(char c) {
        return Character.isISOControl(c) || c == LINE_SEPARATOR || c == PARAGRAPH_SEPARATOR;
    }
}
