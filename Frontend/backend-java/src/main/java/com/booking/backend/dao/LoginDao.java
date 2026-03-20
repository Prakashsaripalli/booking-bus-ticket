package com.booking.backend.dao;

public class LoginDao {

    private static final String ADMIN_USER = "admin";
    private static final String ADMIN_EMAIL = "kumarsaripalli1198@gmail.com";
    private static final String ADMIN_PASS = "admin1234";

    public boolean validateAdmin(String identity, String password) {
        String normalized = identity == null ? "" : identity.trim().toLowerCase();
        return (ADMIN_USER.equals(normalized)
                || ADMIN_EMAIL.equals(normalized)
                || "admin@booking.com".equals(normalized))
                && ADMIN_PASS.equals(password);
    }
}
