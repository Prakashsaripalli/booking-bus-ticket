package com.booking.backend.dao;

import com.booking.backend.utils.Config;

public class LoginDao {

    public boolean validateAdmin(String identity, String password) {
        String normalized = identity == null ? "" : identity.trim().toLowerCase();
        String configuredUser = Config.getAdminUsername().trim().toLowerCase();
        String configuredEmail = Config.getAdminEmail().trim().toLowerCase();
        String configuredPassword = Config.getAdminPassword();

        if (configuredPassword.isBlank()) {
            return false;
        }

        return (configuredUser.equals(normalized)
                || (!configuredEmail.isBlank() && configuredEmail.equals(normalized)))
                && configuredPassword.equals(password);
    }
}
