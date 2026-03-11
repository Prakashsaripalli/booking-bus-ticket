package com.booking.backend.dao;

import com.booking.backend.utils.JdbcUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class OtpDao {

    public void saveOtp(String mobile, String otp, long expiryMillis) {
        long expiresAt = System.currentTimeMillis() + expiryMillis;
        String sql = """
                INSERT INTO otps(mobile, otp, expires_at, created_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at), created_at = CURRENT_TIMESTAMP
                """;
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, mobile);
            ps.setString(2, otp);
            ps.setLong(3, expiresAt);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save OTP", e);
        }
    }

    public boolean verifyOtp(String mobile, String otp) {
        String selectSql = "SELECT otp, expires_at FROM otps WHERE mobile = ?";
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement selectPs = conn.prepareStatement(selectSql)) {
            selectPs.setString(1, mobile);

            try (ResultSet rs = selectPs.executeQuery()) {
                if (!rs.next()) {
                    return false;
                }

                long expiresAt = rs.getLong("expires_at");
                String storedOtp = rs.getString("otp");

                if (System.currentTimeMillis() > expiresAt) {
                    deleteOtp(conn, mobile);
                    return false;
                }

                boolean matched = otp.equals(storedOtp);
                if (matched) {
                    deleteOtp(conn, mobile);
                }
                return matched;
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to verify OTP", e);
        }
    }

    private void deleteOtp(Connection conn, String mobile) throws SQLException {
        try (PreparedStatement deletePs = conn.prepareStatement("DELETE FROM otps WHERE mobile = ?")) {
            deletePs.setString(1, mobile);
            deletePs.executeUpdate();
        }
    }
}
