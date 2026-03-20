package com.booking.backend.utils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class Config {
    private static final Pattern BAT_SET_PATTERN = Pattern.compile("^\\s*set\\s+\"?([^=]+)=(.*)\"?\\s*$", Pattern.CASE_INSENSITIVE);
    private static final Pattern BAT_REFERENCE_PATTERN = Pattern.compile("%([^%]+)%");
    private static final Map<String, String> FILE_OVERRIDES = loadBatchOverrides();

    private Config() {
    }

    // Database Keys
    public static final String DB_URL = "DB_URL";
    public static final String DB_USER = "DB_USER";
    public static final String DB_PASSWORD = "DB_PASSWORD";

    // SMTP Keys
    public static final String SMTP_HOST = "SMTP_HOST";
    public static final String SMTP_PORT = "SMTP_PORT";
    public static final String SMTP_USER = "SMTP_USER";
    public static final String SMTP_APP_PASSWORD = "SMTP_APP_PASSWORD";
    public static final String SMTP_FROM = "SMTP_FROM";
    
    // Debug Flags
    public static final String OTP_DEBUG = "OTP_DEBUG";
    public static final String EMAIL_DEBUG = "EMAIL_DEBUG";
    public static final String ALLOWED_ORIGIN = "ALLOWED_ORIGIN";

    // Default Values
    private static final String DEFAULT_DB_URL = "jdbc:mysql://localhost:3306/booking?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String DEFAULT_DB_USER = "root";
    private static final String DEFAULT_DB_PASSWORD = "root123";
    private static final String DEFAULT_SMTP_HOST = "smtp.gmail.com";
    private static final String DEFAULT_SMTP_PORT = "587";
    private static final String DEFAULT_ALLOWED_ORIGIN = "*";

    public static String getDbUrl() {
        return get(DB_URL, DEFAULT_DB_URL);
    }

    public static String getDbUser() {
        return get(DB_USER, DEFAULT_DB_USER);
    }

    public static String getDbPassword() {
        return get(DB_PASSWORD, DEFAULT_DB_PASSWORD);
    }

    public static String getSmtpHost() {
        return get(SMTP_HOST, DEFAULT_SMTP_HOST);
    }

    public static String getSmtpPort() {
        return get(SMTP_PORT, DEFAULT_SMTP_PORT);
    }

    public static String getSmtpUser() {
        return get(SMTP_USER, "");
    }

    public static String getSmtpPassword() {
        return get(SMTP_APP_PASSWORD, "");
    }

    public static String getSmtpFrom() {
        String from = get(SMTP_FROM, "");
        if (from.isEmpty() || (from.startsWith("%") && from.endsWith("%") && from.length() > 2)) {
            return getSmtpUser();
        }
        return from;
    }

    public static boolean isOtpDebug() {
        return "true".equalsIgnoreCase(get(OTP_DEBUG, "false"));
    }

    public static boolean isEmailDebug() {
        return "true".equalsIgnoreCase(get(EMAIL_DEBUG, "false"));
    }

    public static String getAllowedOrigin() {
        return get(ALLOWED_ORIGIN, DEFAULT_ALLOWED_ORIGIN);
    }

    private static String get(String key, String defaultValue) {
        String value = System.getenv(key);
        if (value != null && !value.isBlank()) {
            return value.trim();
        }

        value = FILE_OVERRIDES.get(key);
        if (value != null && !value.isBlank()) {
            return value.trim();
        }

        return defaultValue;
    }

    private static Map<String, String> loadBatchOverrides() {
        Map<String, String> values = new LinkedHashMap<>();
        for (Path candidate : configCandidates()) {
            if (!Files.isRegularFile(candidate)) {
                continue;
            }
            try {
                for (String rawLine : Files.readAllLines(candidate)) {
                    parseBatchLine(rawLine, values);
                }
            } catch (IOException ignored) {
                // Fall back to defaults when local config files are unavailable.
            }
        }
        return values;
    }

    private static Path[] configCandidates() {
        return new Path[] {
                Paths.get(".env.bat"),
                Paths.get("db.env.bat"),
                Paths.get("smtp.env.bat"),
                Paths.get("backend-java", ".env.bat"),
                Paths.get("backend-java", "db.env.bat"),
                Paths.get("backend-java", "smtp.env.bat")
        };
    }

    private static void parseBatchLine(String rawLine, Map<String, String> values) {
        if (rawLine == null) {
            return;
        }

        String line = rawLine.trim();
        if (line.isEmpty() || line.regionMatches(true, 0, "REM", 0, 3) || line.startsWith("::")) {
            return;
        }

        Matcher matcher = BAT_SET_PATTERN.matcher(line);
        if (!matcher.matches()) {
            return;
        }

        String key = matcher.group(1).trim();
        String value = stripWrappingQuote(matcher.group(2).trim());
        values.put(key, expandBatchReferences(value, values));
    }

    private static String expandBatchReferences(String value, Map<String, String> values) {
        Matcher matcher = BAT_REFERENCE_PATTERN.matcher(value);
        StringBuilder expanded = new StringBuilder();

        while (matcher.find()) {
            String reference = matcher.group(1);
            String replacement = System.getenv(reference);
            if (replacement == null || replacement.isBlank()) {
                replacement = values.get(reference);
            }
            if (replacement == null) {
                replacement = matcher.group(0);
            }
            matcher.appendReplacement(expanded, Matcher.quoteReplacement(replacement));
        }

        matcher.appendTail(expanded);
        return expanded.toString();
    }

    private static String stripWrappingQuote(String value) {
        if (value.endsWith("\"")) {
            return value.substring(0, value.length() - 1).trim();
        }
        return value;
    }
}
