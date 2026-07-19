package com.booking.backend.model;

public record AuthenticatedUser(
        String role,
        String identity,
        String name,
        String email,
        String mobile
) {
    public boolean isAdmin() {
        return "admin".equalsIgnoreCase(role);
    }

    public boolean isUser() {
        return "user".equalsIgnoreCase(role);
    }

    public String loginIdentity() {
        if (email != null && !email.isBlank()) {
            return email.trim().toLowerCase();
        }
        return identity == null ? "" : identity.trim().toLowerCase();
    }

    public String normalizedMobile() {
        return mobile == null ? "" : mobile.trim();
    }
}
