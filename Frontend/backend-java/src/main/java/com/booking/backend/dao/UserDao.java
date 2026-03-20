package com.booking.backend.dao;

import com.booking.backend.model.User;
import com.booking.backend.utils.JdbcUtil;
import com.booking.backend.utils.PasswordUtil;
import com.booking.backend.utils.ValidationUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class UserDao {

    public boolean userExists(String identity) {
        String key = normalizeIdentity(identity);
        if (key.isEmpty()) {
            return false;
        }

        String sql = "SELECT 1 FROM users WHERE identity = ? OR email = ? LIMIT 1";
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, key);
            ps.setString(2, key);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to check user", e);
        }
    }

    public boolean createUserOrInitializePassword(String identity, String password) {
        String key = normalizeIdentity(identity);
        if (key.isEmpty()) {
            return false;
        }

        String storedHash = getPasswordHashByIdentity(key);
        if (!storedHash.isEmpty()) {
            return false;
        }

        String email = ValidationUtil.isValidEmail(key) ? key : "";
        String sql = """
                INSERT INTO users(identity, email, password_hash)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    email = CASE
                        WHEN email IS NULL OR email = '' THEN VALUES(email)
                        ELSE email
                    END,
                    password_hash = CASE
                        WHEN password_hash IS NULL OR password_hash = '' THEN VALUES(password_hash)
                        ELSE password_hash
                    END
                """;
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, key);
            ps.setString(2, email);
            ps.setString(3, PasswordUtil.hashPassword(password));
            ps.executeUpdate();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to save user password", e);
        }
    }

    public boolean validateUserPassword(String identity, String password) {
        String key = normalizeIdentity(identity);
        if (key.isEmpty()) {
            return false;
        }

        String storedHash = getPasswordHashByIdentity(key);
        return PasswordUtil.matches(password, storedHash);
    }

    public boolean updatePassword(String identityOrEmail, String newPassword) {
        String key = normalizeIdentity(identityOrEmail);
        if (key.isEmpty()) {
            return false;
        }

        String sql = "UPDATE users SET password_hash = ? WHERE identity = ? OR email = ?";
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, PasswordUtil.hashPassword(newPassword));
            ps.setString(2, key);
            ps.setString(3, key);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to update password", e);
        }
    }

    public User getUserByIdentity(String identity) {
        String key = normalizeIdentity(identity);
        if (key.isEmpty()) {
            return null;
        }

        String sql = "SELECT identity, name, email, mobile FROM users WHERE identity = ? OR email = ? LIMIT 1";
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, key);
            ps.setString(2, key);
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
            e.printStackTrace();
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
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch user by mobile", e);
        }
    }

    public User updateUserProfile(String currentIdentity, String name, String email, String mobile) {
        String oldIdentity = normalizeIdentity(currentIdentity);
        String newIdentity = email == null ? oldIdentity : email.trim().toLowerCase();

        String normalizedName = name == null ? "" : name.trim();
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        String normalizedMobile = mobile == null ? "" : mobile.trim();
        String preservedPasswordHash = getPasswordHashByIdentity(oldIdentity);

        if (preservedPasswordHash.isEmpty() && !oldIdentity.equals(newIdentity)) {
            preservedPasswordHash = getPasswordHashByIdentity(newIdentity);
        }

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
                        INSERT INTO users(identity, name, email, mobile, password_hash)
                        VALUES (?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            name = VALUES(name),
                            email = VALUES(email),
                            mobile = VALUES(mobile),
                            password_hash = CASE
                                WHEN password_hash IS NULL OR password_hash = '' THEN VALUES(password_hash)
                                ELSE password_hash
                            END
                        """;

                try (PreparedStatement upsert = conn.prepareStatement(upsertSql)) {
                    upsert.setString(1, newIdentity);
                    upsert.setString(2, normalizedName);
                    upsert.setString(3, normalizedEmail);
                    upsert.setString(4, normalizedMobile);
                    upsert.setString(5, preservedPasswordHash);
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
            e.printStackTrace();
            throw new RuntimeException("Failed to update profile", e);
        }

        return getUserByIdentity(newIdentity);
    }

    private String getPasswordHashByIdentity(String identity) {
        String key = normalizeIdentity(identity);
        if (key.isEmpty()) {
            return "";
        }

        String sql = "SELECT password_hash FROM users WHERE identity = ? OR email = ? LIMIT 1";
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, key);
            ps.setString(2, key);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    return "";
                }
                String hash = rs.getString("password_hash");
                return hash == null ? "" : hash.trim();
            }
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch password hash", e);
        }
    }

    private String normalizeIdentity(String identity) {
        return identity == null ? "" : identity.trim().toLowerCase();
    }
}
