package com.booking.backend.dao;

import com.booking.backend.model.Bus;
import com.booking.backend.model.PopularRoute;
import com.booking.backend.utils.JdbcUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class BusDao {

    public List<Bus> searchByRoute(String from, String to) {
        String sql = """
                SELECT id, name, from_city, to_city, departure_time, bus_type, price
                FROM buses
                WHERE LOWER(from_city) = LOWER(?) AND LOWER(to_city) = LOWER(?)
                ORDER BY departure_time
                """;

        List<Bus> buses = new ArrayList<>();
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, from);
            ps.setString(2, to);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    buses.add(new Bus(
                            rs.getInt("id"),
                            rs.getString("name"),
                            rs.getString("from_city"),
                            rs.getString("to_city"),
                            rs.getString("departure_time"),
                            rs.getString("bus_type"),
                            rs.getInt("price")
                    ));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to search buses", e);
        }

        return buses;
    }

    public List<PopularRoute> getPopularRoutes(int limit) {
        String sql = """
                SELECT from_city, to_city, COUNT(*) AS bus_count
                FROM buses
                GROUP BY from_city, to_city
                ORDER BY bus_count DESC, from_city ASC, to_city ASC
                LIMIT ?
                """;

        List<PopularRoute> routes = new ArrayList<>();
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    routes.add(new PopularRoute(
                            rs.getString("from_city"),
                            rs.getString("to_city"),
                            rs.getInt("bus_count")
                    ));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch popular routes", e);
        }

        return routes;
    }
}
