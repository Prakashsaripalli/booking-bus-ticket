package com.booking.backend.utils;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;

public final class JdbcUtil {

    private JdbcUtil() {
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(Config.getDbUrl(), Config.getDbUser(), Config.getDbPassword());
    }

    public static void initSchema() throws SQLException {
        try (Connection conn = getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS buses (
                        id INT PRIMARY KEY AUTO_INCREMENT,
                        name VARCHAR(120) NOT NULL,
                        from_city VARCHAR(80) NOT NULL,
                        to_city VARCHAR(80) NOT NULL,
                        departure_time VARCHAR(20) NOT NULL,
                        bus_type VARCHAR(60) NOT NULL,
                        price INT NOT NULL
                    )
                    """);

            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        identity VARCHAR(255) PRIMARY KEY,
                        name VARCHAR(120) DEFAULT '',
                        email VARCHAR(255) DEFAULT '',
                        mobile VARCHAR(20) DEFAULT '',
                        password_hash VARCHAR(64) DEFAULT '',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                    """);
            try {
                stmt.execute("ALTER TABLE users ADD COLUMN name VARCHAR(120) DEFAULT ''");
            } catch (SQLException ignored) {
                // Column may already exist.
            }
            try {
                stmt.execute("ALTER TABLE users ADD COLUMN email VARCHAR(255) DEFAULT ''");
            } catch (SQLException ignored) {
                // Column may already exist.
            }
            try {
                stmt.execute("ALTER TABLE users ADD COLUMN mobile VARCHAR(20) DEFAULT ''");
            } catch (SQLException ignored) {
                // Column may already exist.
            }
            try {
                stmt.execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR(64) DEFAULT ''");
            } catch (SQLException ignored) {
                // Column may already exist.
            }

            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS otps (
                        mobile VARCHAR(255) PRIMARY KEY,
                        otp VARCHAR(6) NOT NULL,
                        expires_at BIGINT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                    """);
            try {
                stmt.execute("ALTER TABLE otps MODIFY COLUMN mobile VARCHAR(255) NOT NULL");
            } catch (SQLException ignored) {
                // Column may already be in expected format.
            }

            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS payments (
                        payment_id VARCHAR(64) PRIMARY KEY,
                        passenger_name VARCHAR(120) NOT NULL,
                        mobile VARCHAR(20) NOT NULL,
                        email VARCHAR(255) NOT NULL,
                        amount INT NOT NULL,
                        transaction_id VARCHAR(120) NOT NULL,
                        status VARCHAR(20) NOT NULL,
                        created_at VARCHAR(50) NOT NULL
                    )
                    """);

            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS bookings (
                        booking_id VARCHAR(64) PRIMARY KEY,
                        from_city VARCHAR(80) NOT NULL,
                        to_city VARCHAR(80) NOT NULL,
                        bus_name VARCHAR(120) NOT NULL,
                        seats VARCHAR(255) NOT NULL,
                        journey_date VARCHAR(20) NOT NULL,
                        departure_time VARCHAR(20) NOT NULL,
                        original_amount INT NOT NULL,
                        amount INT NOT NULL,
                        discount_amount INT NOT NULL,
                        passenger_name VARCHAR(120) NOT NULL,
                        passenger_mobile VARCHAR(20) NOT NULL,
                        passenger_email VARCHAR(255) NOT NULL,
                        owner_email VARCHAR(255) DEFAULT '',
                        owner_mobile VARCHAR(20) DEFAULT '',
                        payment_method VARCHAR(60) NOT NULL,
                        transaction_id VARCHAR(120) NOT NULL,
                        status VARCHAR(40) NOT NULL,
                        booked_at VARCHAR(50) NOT NULL,
                        cancelled_at VARCHAR(50),
                        refund_status VARCHAR(40),
                        refund_amount INT DEFAULT 0,
                        refunded_at VARCHAR(50)
                    )
                    """);

            seedBuses(conn);
        }
    }

    private static void seedBuses(Connection conn) throws SQLException {
        String[][] buses = {
                {"Yubus Express", "Hyderabad", "Vijayawada", "06:30 AM", "AC Sleeper", "899"},
                {"Yubus Deluxe", "Hyderabad", "Vijayawada", "10:00 PM", "Non-AC Seater", "699"},
                {"Yubus Sunrise", "Hyderabad", "Vijayawada", "11:30 PM", "AC Seater", "849"},
                {"Yubus Star", "Vijayawada", "Hyderabad", "07:00 AM", "AC Seater", "799"},
                {"Yubus Return", "Vijayawada", "Hyderabad", "03:45 PM", "Sleeper", "949"},
                {"Yubus Royal", "Hyderabad", "Bangalore", "05:30 PM", "AC Sleeper", "1299"},
                {"Yubus Luxury", "Hyderabad", "Bangalore", "09:00 PM", "AC Volvo", "1599"},
                {"Yubus Falcon", "Hyderabad", "Bangalore", "10:45 PM", "Sleeper", "1399"},
                {"Yubus Night Rider", "Bangalore", "Hyderabad", "06:15 PM", "Sleeper", "1199"},
                {"Yubus Sapphire", "Bangalore", "Hyderabad", "09:45 PM", "AC Sleeper", "1349"},
                {"Yubus Dawn", "Bangalore", "Hyderabad", "11:15 PM", "AC Volvo", "1499"},
                {"Yubus Comfort", "Hyderabad", "Chennai", "08:00 PM", "AC Sleeper", "1499"},
                {"Yubus Coastline", "Hyderabad", "Chennai", "09:30 PM", "AC Volvo", "1549"},
                {"Yubus Metro", "Hyderabad", "Chennai", "11:00 PM", "Non-AC Sleeper", "1249"},
                {"Yubus SuperFast", "Chennai", "Hyderabad", "06:00 AM", "Non-AC", "999"},
                {"Yubus Southern", "Chennai", "Hyderabad", "08:30 PM", "AC Sleeper", "1399"},
                {"Yubus Meridian", "Chennai", "Hyderabad", "10:15 PM", "AC Volvo", "1499"},
                {"Yubus Link", "Bangalore", "Chennai", "07:00 AM", "AC Seater", "799"},
                {"Yubus Corridor", "Bangalore", "Chennai", "01:30 PM", "Sleeper", "949"},
                {"Yubus Connect", "Bangalore", "Chennai", "10:30 PM", "AC Sleeper", "1099"},
                {"Yubus Bay", "Chennai", "Bangalore", "06:30 AM", "AC Seater", "829"},
                {"Yubus Velocity", "Chennai", "Bangalore", "09:45 PM", "Sleeper", "999"},
                {"Yubus Temple", "Bangalore", "Tirupati", "09:00 PM", "AC Sleeper", "899"},
                {"Yubus Pilgrim", "Bangalore", "Tirupati", "11:00 PM", "Non-AC Seater", "699"},
                {"Yubus Darshan", "Hyderabad", "Tirupati", "07:30 PM", "AC Sleeper", "1199"},
                {"Yubus Balaji", "Hyderabad", "Tirupati", "10:00 PM", "Sleeper", "999"},
                {"Yubus Coast", "Hyderabad", "Visakhapatnam", "05:45 PM", "AC Sleeper", "1399"},
                {"Yubus Seaside", "Hyderabad", "Visakhapatnam", "09:15 PM", "AC Volvo", "1599"},
                {"Yubus Heritage", "Chennai", "Madurai", "08:15 PM", "AC Sleeper", "999"},
                {"Yubus Lotus", "Chennai", "Madurai", "10:45 PM", "Sleeper", "849"},
                {"Yubus Capital", "Delhi", "Lucknow", "09:00 PM", "AC Sleeper", "1499"},
                {"Yubus Ganga", "Delhi", "Lucknow", "11:30 PM", "AC Volvo", "1699"},
                {"Yubus Beach", "Goa", "Bangalore", "08:00 PM", "Sleeper", "1299"},
                {"Yubus Konkan", "Goa", "Bangalore", "10:30 PM", "AC Sleeper", "1499"},
                {"Yubus Escape", "Bangalore", "Goa", "07:30 PM", "AC Sleeper", "1399"},
                {"Yubus Coastal", "Bangalore", "Goa", "10:00 PM", "Sleeper", "1199"},
                {"Yubus Pearl", "Nellore", "Chennai", "06:00 AM", "AC Seater", "549"},
                {"Yubus Gateway", "Nellore", "Chennai", "05:15 PM", "Non-AC Seater", "449"},
                {"Yubus Marina", "Chennai", "Nellore", "08:00 AM", "AC Seater", "579"},
                {"Yubus Shore", "Chennai", "Nellore", "06:45 PM", "Sleeper", "649"},
                {"Yubus Frontier", "Hyderabad", "Nellore", "08:45 PM", "AC Sleeper", "999"},
                {"Yubus Horizon", "Hyderabad", "Nellore", "10:20 PM", "Sleeper", "899"},
                {"Yubus Deccan", "Nellore", "Hyderabad", "07:10 PM", "AC Sleeper", "949"},
                {"Yubus Pink", "Hyderabad", "Jaipur", "04:30 PM", "AC Sleeper", "1899"},
                {"Yubus Desert", "Hyderabad", "Jaipur", "07:45 PM", "AC Volvo", "2099"},
                {"Yubus Royal Raj", "Jaipur", "Hyderabad", "05:00 PM", "AC Sleeper", "1949"},
                {"Yubus Capital Connect", "Hyderabad", "Delhi", "03:30 PM", "AC Sleeper", "2199"},
                {"Yubus North Star", "Hyderabad", "Delhi", "06:45 PM", "AC Volvo", "2399"},
                {"Yubus Red Fort", "Hyderabad", "Delhi", "09:15 PM", "Sleeper", "1999"},
                {"Yubus Deccan Return", "Delhi", "Hyderabad", "04:00 PM", "AC Sleeper", "2149"},
                {"Yubus Capital Return", "Delhi", "Hyderabad", "08:10 PM", "AC Volvo", "2349"},
                {"Yubus Western", "Bangalore", "Mangalore", "06:30 AM", "AC Seater", "699"},
                {"Yubus Coast Express", "Bangalore", "Mangalore", "10:00 PM", "Sleeper", "899"},
                {"Yubus Harbor", "Mangalore", "Bangalore", "07:30 AM", "AC Seater", "749"},
                {"Yubus Monsoon", "Mangalore", "Bangalore", "09:45 PM", "Sleeper", "949"}
        };

        String sql = """
                INSERT INTO buses(name, from_city, to_city, departure_time, bus_type, price)
                SELECT ?, ?, ?, ?, ?, ?
                WHERE NOT EXISTS (
                    SELECT 1 FROM buses
                    WHERE name = ? AND from_city = ? AND to_city = ? AND departure_time = ?
                )
                """;

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (String[] bus : buses) {
                ps.setString(1, bus[0]);
                ps.setString(2, bus[1]);
                ps.setString(3, bus[2]);
                ps.setString(4, bus[3]);
                ps.setString(5, bus[4]);
                ps.setInt(6, Integer.parseInt(bus[5]));
                ps.setString(7, bus[0]);
                ps.setString(8, bus[1]);
                ps.setString(9, bus[2]);
                ps.setString(10, bus[3]);
                ps.addBatch();
            }
            ps.executeBatch();
        }
    }
}
