package com.booking.backend.dao;

import com.booking.backend.model.PaymentRecord;
import com.booking.backend.utils.JdbcUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.Instant;
import java.util.UUID;

public class PaymentDao {

    public synchronized PaymentRecord save(String passengerName, String mobile, String email, int amount, String transactionId) {
        String normalizedTransactionId = normalizeTransactionId(transactionId);

        if (existsByTransactionId(normalizedTransactionId)) {
            throw new IllegalStateException("Transaction ID already used");
        }

        PaymentRecord record = new PaymentRecord(
                UUID.randomUUID().toString(),
                passengerName,
                mobile,
                email,
                amount,
                normalizedTransactionId,
                "SUCCESS",
                Instant.now().toString()
        );

        String sql = """
                INSERT INTO payments(payment_id, passenger_name, mobile, email, amount, transaction_id, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """;
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, record.getPaymentId());
            ps.setString(2, record.getPassengerName());
            ps.setString(3, record.getMobile());
            ps.setString(4, record.getEmail());
            ps.setInt(5, record.getAmount());
            ps.setString(6, record.getTransactionId());
            ps.setString(7, record.getStatus());
            ps.setString(8, record.getCreatedAt());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save payment", e);
        }
        return record;
    }

    private boolean existsByTransactionId(String transactionId) {
        String sql = """
                SELECT 1
                FROM payments
                WHERE transaction_id = ?
                LIMIT 1
                """;
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, transactionId);
            return ps.executeQuery().next();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to check payment transaction", e);
        }
    }

    private String normalizeTransactionId(String transactionId) {
        return transactionId == null ? "" : transactionId.trim().replaceAll("\\s+", "").toUpperCase();
    }
}
