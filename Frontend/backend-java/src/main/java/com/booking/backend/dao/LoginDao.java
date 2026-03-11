package com.booking.backend.dao;

import com.booking.backend.model.User;
import com.booking.backend.utils.JdbcUtil;
import com.booking.backend.utils.ValidationUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

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

    public User createOrGetUser(String identity) {
        String key = identity.trim().toLowerCase();
        String email = ValidationUtil.isValidEmail(key) ? key : "";
        String sql = """
                INSERT INTO users(identity, email)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE email = CASE
                    WHEN email IS NULL OR email = '' THEN VALUES(email)
                    ELSE email
                END
                """;
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, key);
            ps.setString(2, email);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to create user", e);
        }
        return getUserByIdentity(key);
    }

    public User getUserByIdentity(String identity) {
        String key = identity == null ? "" : identity.trim().toLowerCase();
        if (key.isEmpty()) {
            return null;
        }

        String sql = "SELECT identity, name, email, mobile FROM users WHERE identity = ?";
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, key);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }

                return new User(
                        rs.getString("identity"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("mobile")
                );
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch user", e);
        }
    }

    public User getUserByMobile(String mobile) {
        String normalizedMobile = mobile == null ? "" : mobile.trim();
        if (normalizedMobile.isEmpty()) {
            return null;
        }

        String sql = "SELECT identity, name, email, mobile FROM users WHERE mobile = ?";
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, normalizedMobile);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }

                return new User(
                        rs.getString("identity"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("mobile")
                );
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch user by mobile", e);
        }
    }

    public User updateUserProfile(String currentIdentity, String name, String email, String mobile) {
        String oldIdentity = currentIdentity == null ? "" : currentIdentity.trim().toLowerCase();
        String newIdentity = email == null ? oldIdentity : email.trim().toLowerCase();

        String normalizedName = name == null ? "" : name.trim();
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        String normalizedMobile = mobile == null ? "" : mobile.trim();

        User existingMobileUser = getUserByMobile(normalizedMobile);
        if (existingMobileUser != null
                && !existingMobileUser.getIdentity().equals(oldIdentity)
                && !existingMobileUser.getIdentity().equals(newIdentity)) {
            throw new IllegalStateException("Mobile number already registered");
        }

        try (Connection conn = JdbcUtil.getConnection()) {
            conn.setAutoCommit(false);

            try {
                String upsertSql = """
                        INSERT INTO users(identity, name, email, mobile)
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            name = VALUES(name),
                            email = VALUES(email),
                            mobile = VALUES(mobile)
                        """;

                try (PreparedStatement upsert = conn.prepareStatement(upsertSql)) {
                    upsert.setString(1, newIdentity);
                    upsert.setString(2, normalizedName);
                    upsert.setString(3, normalizedEmail);
                    upsert.setString(4, normalizedMobile);
                    upsert.executeUpdate();
                }

                if (!oldIdentity.isEmpty() && !oldIdentity.equals(newIdentity)) {
                    try (PreparedStatement delete = conn.prepareStatement("DELETE FROM users WHERE identity = ?")) {
                        delete.setString(1, oldIdentity);
                        delete.executeUpdate();
                    }
                }

                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update profile", e);
        }

        return getUserByIdentity(newIdentity);
    }
}
