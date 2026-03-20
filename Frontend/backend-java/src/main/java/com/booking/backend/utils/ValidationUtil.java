package com.booking.backend.utils;

public class ValidationUtil {
    public static boolean isValidEmail(String email) {
        return email != null && email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    }

    public static boolean isValidMobile(String mobile) {
        return mobile != null && mobile.matches("^(\\+91)?[6-9]\\d{9}$");
    }

    public static boolean isValidOtp(String otp) {
        return otp != null && otp.matches("^\\d{6}$");
    }

    public static boolean isValidPassword(String password) {
        return password != null && password.trim().length() >= 4;
    }

    public static boolean isValidTransactionId(String tx) {
        return tx != null && tx.matches("^[A-Z]{1,4}\\d{22}$");
    }
}
