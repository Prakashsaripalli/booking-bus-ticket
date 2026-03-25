package com.booking.backend.dao;

public class LoginDao {

    private static final String ADMIN_USER = "admin";
    private static final String ADMIN_EMAIL = "yubusadmin@gmail.com";
    private static final String ADMIN_PASS = "admin123";

    public boolean validateAdmin(String identity, String password) {
        String normalized = identity == null ? "" : identity.trim().toLowerCase();
        return (ADMIN_USER.equals(normalized)
                || ADMIN_EMAIL.equals(normalized))
                && ADMIN_PASS.equals(password);
    }
}
