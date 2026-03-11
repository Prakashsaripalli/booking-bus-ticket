package com.booking.backend.utils;

import java.util.regex.Pattern;

public final class ValidationUtil {

    private static final Pattern MOBILE_PATTERN = Pattern.compile("^\\+91[6-9]\\d{9}$");
    private static final Pattern MOBILE_10_PATTERN = Pattern.compile("^[6-9]\\d{9}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern OTP_PATTERN = Pattern.compile("^\\d{6}$");
    private static final Pattern TRANSACTION_ID_PATTERN = Pattern.compile("^[A-Za-z]{1,4}\\d{22}$");

    private ValidationUtil() {
    }

    public static boolean isValidMobile(String mobile) {
        if (mobile == null) {
            return false;
        }
        String value = mobile.trim();
        return MOBILE_PATTERN.matcher(value).matches() || MOBILE_10_PATTERN.matcher(value).matches();
    }

    public static boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    public static boolean isValidOtp(String otp) {
        return otp != null && OTP_PATTERN.matcher(otp.trim()).matches();
    }

    public static boolean isValidTransactionId(String transactionId) {
        return transactionId != null && TRANSACTION_ID_PATTERN.matcher(transactionId.trim()).matches();
    }
}
