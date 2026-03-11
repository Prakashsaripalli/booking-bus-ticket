package com.booking.backend.dao;

import com.booking.backend.model.BookingRecord;
import com.booking.backend.utils.JdbcUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class BookingDao {

    public void save(BookingRecord booking) {
        String sql = """
                INSERT INTO bookings(
                    booking_id, from_city, to_city, bus_name, seats, journey_date, departure_time,
                    original_amount, amount, discount_amount, passenger_name, passenger_mobile, passenger_email,
                    owner_email, owner_mobile, payment_method, transaction_id, status, booked_at,
                    cancelled_at, refund_status, refund_amount, refunded_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    from_city = VALUES(from_city),
                    to_city = VALUES(to_city),
                    bus_name = VALUES(bus_name),
                    seats = VALUES(seats),
                    journey_date = VALUES(journey_date),
                    departure_time = VALUES(departure_time),
                    original_amount = VALUES(original_amount),
                    amount = VALUES(amount),
                    discount_amount = VALUES(discount_amount),
                    passenger_name = VALUES(passenger_name),
                    passenger_mobile = VALUES(passenger_mobile),
                    passenger_email = VALUES(passenger_email),
                    owner_email = VALUES(owner_email),
                    owner_mobile = VALUES(owner_mobile),
                    payment_method = VALUES(payment_method),
                    transaction_id = VALUES(transaction_id),
                    status = VALUES(status),
                    booked_at = VALUES(booked_at)
                """;
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            bindBooking(ps, booking);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to save booking", e);
        }
    }

    public List<BookingRecord> listAll() {
        String sql = "SELECT * FROM bookings ORDER BY booked_at DESC";
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            return mapBookings(rs);
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch bookings", e);
        }
    }

    public List<BookingRecord> listByOwner(String ownerEmail, String ownerMobile) {
        String sql = """
                SELECT * FROM bookings
                WHERE (owner_email <> '' AND owner_email = ?)
                   OR (owner_mobile <> '' AND owner_mobile = ?)
                ORDER BY booked_at DESC
                """;
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, normalize(ownerEmail));
            ps.setString(2, normalize(ownerMobile));
            try (ResultSet rs = ps.executeQuery()) {
                return mapBookings(rs);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch owner bookings", e);
        }
    }

    public BookingRecord updateStatus(
            String bookingId,
            String status,
            String cancelledAt,
            String refundStatus,
            int refundAmount,
            String refundedAt
    ) {
        String sql = """
                UPDATE bookings
                SET status = ?, cancelled_at = ?, refund_status = ?, refund_amount = ?, refunded_at = ?
                WHERE booking_id = ?
                """;
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, normalize(status));
            ps.setString(2, normalizeNullable(cancelledAt));
            ps.setString(3, normalizeNullable(refundStatus));
            ps.setInt(4, refundAmount);
            ps.setString(5, normalizeNullable(refundedAt));
            ps.setString(6, normalize(bookingId));
            if (ps.executeUpdate() == 0) {
                return null;
            }
            return findByBookingId(bookingId);
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update booking status", e);
        }
    }

    public BookingRecord findByBookingId(String bookingId) {
        String sql = "SELECT * FROM bookings WHERE booking_id = ?";
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, normalize(bookingId));
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                return mapBooking(rs);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch booking", e);
        }
    }

    private void bindBooking(PreparedStatement ps, BookingRecord booking) throws SQLException {
        ps.setString(1, booking.getBookingId());
        ps.setString(2, booking.getFrom());
        ps.setString(3, booking.getTo());
        ps.setString(4, booking.getBusName());
        ps.setString(5, booking.getSeats());
        ps.setString(6, booking.getJourneyDate());
        ps.setString(7, booking.getDepartureTime());
        ps.setInt(8, booking.getOriginalAmount());
        ps.setInt(9, booking.getAmount());
        ps.setInt(10, booking.getDiscountAmount());
        ps.setString(11, booking.getPassengerName());
        ps.setString(12, booking.getPassengerMobile());
        ps.setString(13, booking.getPassengerEmail());
        ps.setString(14, booking.getOwnerEmail());
        ps.setString(15, booking.getOwnerMobile());
        ps.setString(16, booking.getPaymentMethod());
        ps.setString(17, booking.getTransactionId());
        ps.setString(18, booking.getStatus());
        ps.setString(19, booking.getBookedAt());
        ps.setString(20, booking.getCancelledAt());
        ps.setString(21, booking.getRefundStatus());
        ps.setInt(22, booking.getRefundAmount());
        ps.setString(23, booking.getRefundedAt());
    }

    private List<BookingRecord> mapBookings(ResultSet rs) throws SQLException {
        List<BookingRecord> bookings = new ArrayList<>();
        while (rs.next()) {
            bookings.add(mapBooking(rs));
        }
        return bookings;
    }

    private BookingRecord mapBooking(ResultSet rs) throws SQLException {
        return new BookingRecord(
                rs.getString("booking_id"),
                rs.getString("from_city"),
                rs.getString("to_city"),
                rs.getString("bus_name"),
                rs.getString("seats"),
                rs.getString("journey_date"),
                rs.getString("departure_time"),
                rs.getInt("original_amount"),
                rs.getInt("amount"),
                rs.getInt("discount_amount"),
                rs.getString("passenger_name"),
                rs.getString("passenger_mobile"),
                rs.getString("passenger_email"),
                rs.getString("owner_email"),
                rs.getString("owner_mobile"),
                rs.getString("payment_method"),
                rs.getString("transaction_id"),
                rs.getString("status"),
                rs.getString("booked_at"),
                rs.getString("cancelled_at"),
                rs.getString("refund_status"),
                rs.getInt("refund_amount"),
                rs.getString("refunded_at")
        );
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeNullable(String value) {
        String normalized = normalize(value);
        return normalized.isEmpty() ? null : normalized;
    }
}
