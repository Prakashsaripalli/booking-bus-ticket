package com.booking.backend.dao;

import com.booking.backend.model.Bus;
import com.booking.backend.model.BusRoute;
import com.booking.backend.model.PopularRoute;
import com.booking.backend.utils.JdbcUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class BusDao {

    private static final List<List<String>> ROUTE_CORRIDORS = List.of(
            List.of("Visakhapatnam", "Anakapalle", "Tuni", "Samalkot", "Jaggampeta", "Rajahmundry", "Kovvur", "Eluru", "Vijayawada", "Nandigama", "Kodad", "Suryapet", "Hyderabad"),
            List.of("Hyderabad", "Vijayawada", "Guntur", "Ongole", "Nellore", "Chennai"),
            List.of("Hyderabad", "Kurnool", "Anantapur", "Bangalore", "Mysuru"),
            List.of("Hyderabad", "Kurnool", "Anantapur", "Dharmavaram", "Kadiri", "Chittoor", "Tirupati"),
            List.of("Chennai", "Vellore", "Krishnagiri", "Hosur", "Bangalore"),
            List.of("Bangalore", "Tumakuru", "Chitradurga", "Davanagere", "Hubballi", "Belagavi"),
            List.of("Bangalore", "Hassan", "Sakleshpur", "Mangaluru"),
            List.of("Chennai", "Salem", "Erode", "Coimbatore", "Palakkad", "Thrissur", "Kochi"),
            List.of("Kochi", "Kottayam", "Pathanamthitta", "Thiruvananthapuram"),
            List.of("Bhubaneswar", "Cuttack", "Kendrapara", "Jagatsinghpur", "Brahmapur", "Visakhapatnam"),
            List.of("Hyderabad", "Warangal", "Khammam", "Vijayawada"),
            List.of("Vijayawada", "Tenali", "Guntur", "Narasaraopet", "Sattenapalli", "Markapur", "Kurnool"),
            List.of("Vijayawada", "Machilipatnam"),
            List.of("Rajahmundry", "Kakinada", "Amalapuram"),
            List.of("Hyderabad", "Karimnagar", "Nizamabad", "Adilabad"),
            List.of("Hyderabad", "Mahabubnagar", "Kurnool"),
            List.of("Nellore", "Gudur", "Naidupeta", "Tirupati")
    );

    private static final Map<String, String> CITY_ALIASES = Map.ofEntries(
            Map.entry("bangalore", "bangalore"),
            Map.entry("bengaluru", "bangalore"),
            Map.entry("vizag", "visakhapatnam"),
            Map.entry("visakhapatnam", "visakhapatnam"),
            Map.entry("hyd", "hyderabad"),
            Map.entry("kovur", "kovvur"),
            Map.entry("cochin", "kochi"),
            Map.entry("kochi", "kochi")
    );

    private static final Map<String, Set<String>> ROUTE_GRAPH = buildRouteGraph();
    private static final Map<String, String> CITY_DISPLAY_NAMES = buildCityDisplayNames();

    public List<Bus> searchByRoute(String from, String to) {
        String source = String.valueOf(from == null ? "" : from).trim();
        String destination = String.valueOf(to == null ? "" : to).trim();
        String sourceKey = normalizeCityKey(source);
        String destinationKey = normalizeCityKey(destination);

        List<Bus> buses = new ArrayList<>();
        for (Bus bus : fetchAllBuses()) {
            List<String> routeStops = resolveRouteStops(bus.fromCity, bus.toCity);
            int sourceIndex = indexOfCity(routeStops, sourceKey);
            int destinationIndex = indexOfCity(routeStops, destinationKey);
            if (sourceIndex < 0 || destinationIndex < 0 || sourceIndex >= destinationIndex) {
                continue;
            }

            Map<String, String> stopTimeline = buildStopTimeline(
                    routeStops,
                    bus.departureTime,
                    estimateTravelMinutes(bus.fromCity, bus.toCity)
            );

            String sourceStop = routeStops.get(sourceIndex);
            String destinationStop = routeStops.get(destinationIndex);
            String sourceDepartureTime = stopTimeline.getOrDefault(sourceStop, bus.departureTime);
            String destinationArrivalTime = stopTimeline.getOrDefault(destinationStop, sourceDepartureTime);
            String finalArrivalTime = stopTimeline.getOrDefault(routeStops.get(routeStops.size() - 1), destinationArrivalTime);

            buses.add(new Bus(
                    bus.id,
                    bus.name,
                    bus.fromCity,
                    bus.toCity,
                    bus.departureTime,
                    bus.busType,
                    bus.price,
                    finalArrivalTime,
                    sourceDepartureTime,
                    destinationArrivalTime,
                    routeStops
            ));
        }

        buses.sort(Comparator.comparingInt((Bus bus) -> safeTimeSortValue(bus.sourceDepartureTime))
                .thenComparing(bus -> bus.name == null ? "" : bus.name));

        return buses;
    }

    public List<BusRoute> getBusRoutes() {
        String sql = """
                SELECT from_city, to_city, COUNT(*) AS bus_count
                FROM buses
                GROUP BY from_city, to_city
                ORDER BY from_city ASC, to_city ASC
                """;

        List<BusRoute> routes = new ArrayList<>();
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                String fromCity = rs.getString("from_city");
                String toCity = rs.getString("to_city");
                routes.add(new BusRoute(
                        fromCity,
                        toCity,
                        resolveRouteStops(fromCity, toCity),
                        rs.getInt("bus_count")
                ));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch bus routes", e);
        }

        return routes;
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
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch popular routes", e);
        }

        return routes;
    }

    private List<Bus> fetchAllBuses() {
        String sql = """
                SELECT id, name, from_city, to_city, departure_time, bus_type, price
                FROM buses
                ORDER BY departure_time, name
                """;

        List<Bus> buses = new ArrayList<>();
        try (Connection conn = JdbcUtil.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
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
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to load buses", e);
        }

        return buses;
    }

    private List<String> resolveRouteStops(String fromCity, String toCity) {
        String sourceKey = normalizeCityKey(fromCity);
        String destinationKey = normalizeCityKey(toCity);

        for (List<String> corridor : ROUTE_CORRIDORS) {
            List<String> orderedPath = extractOrderedPath(corridor, sourceKey, destinationKey);
            if (!orderedPath.isEmpty()) {
                return orderedPath;
            }
        }

        List<String> pathByKey = findPathByCityKeys(sourceKey, destinationKey);
        if (!pathByKey.isEmpty()) {
            List<String> resolved = new ArrayList<>();
            for (String cityKey : pathByKey) {
                resolved.add(CITY_DISPLAY_NAMES.getOrDefault(cityKey, cityKey));
            }
            return resolved;
        }

        List<String> fallback = new ArrayList<>();
        if (fromCity != null && !fromCity.isBlank()) {
            fallback.add(fromCity.trim());
        }
        if (toCity != null && !toCity.isBlank()) {
            fallback.add(toCity.trim());
        }
        return fallback;
    }

    private List<String> extractOrderedPath(List<String> corridor, String sourceKey, String destinationKey) {
        if (corridor == null || corridor.isEmpty()) {
            return List.of();
        }

        int sourceIndex = -1;
        int destinationIndex = -1;
        for (int index = 0; index < corridor.size(); index += 1) {
            String cityKey = normalizeCityKey(corridor.get(index));
            if (sourceIndex < 0 && cityKey.equals(sourceKey)) {
                sourceIndex = index;
            }
            if (destinationIndex < 0 && cityKey.equals(destinationKey)) {
                destinationIndex = index;
            }
        }

        if (sourceIndex < 0 || destinationIndex < 0 || sourceIndex == destinationIndex) {
            return List.of();
        }

        List<String> orderedPath = new ArrayList<>();
        if (sourceIndex < destinationIndex) {
            for (int index = sourceIndex; index <= destinationIndex; index += 1) {
                orderedPath.add(corridor.get(index));
            }
            return orderedPath;
        }

        for (int index = sourceIndex; index >= destinationIndex; index -= 1) {
            orderedPath.add(corridor.get(index));
        }
        return orderedPath;
    }

    private int indexOfCity(List<String> routeStops, String cityKey) {
        for (int index = 0; index < routeStops.size(); index += 1) {
            if (normalizeCityKey(routeStops.get(index)).equals(cityKey)) {
                return index;
            }
        }
        return -1;
    }

    private static String normalizeCityKey(String value) {
        String raw = String.valueOf(value == null ? "" : value).trim().toLowerCase();
        return CITY_ALIASES.getOrDefault(raw, raw);
    }

    private static Map<String, Set<String>> buildRouteGraph() {
        Map<String, Set<String>> graph = new HashMap<>();

        for (List<String> corridor : ROUTE_CORRIDORS) {
            for (int index = 0; index < corridor.size() - 1; index += 1) {
                String first = normalizeCityKey(corridor.get(index));
                String second = normalizeCityKey(corridor.get(index + 1));

                graph.computeIfAbsent(first, key -> new HashSet<>()).add(second);
                graph.computeIfAbsent(second, key -> new HashSet<>()).add(first);
            }
        }

        return graph;
    }

    private static Map<String, String> buildCityDisplayNames() {
        Map<String, String> names = new HashMap<>();

        for (List<String> corridor : ROUTE_CORRIDORS) {
            for (String city : corridor) {
                String key = normalizeCityKey(city);
                if (!names.containsKey(key)) {
                    names.put(key, city);
                }
            }
        }

        return names;
    }

    private List<String> findPathByCityKeys(String sourceKey, String destinationKey) {
        if (sourceKey.isBlank() || destinationKey.isBlank()) {
            return List.of();
        }
        if (sourceKey.equals(destinationKey)) {
            return List.of(sourceKey);
        }
        if (!ROUTE_GRAPH.containsKey(sourceKey) || !ROUTE_GRAPH.containsKey(destinationKey)) {
            return List.of();
        }

        ArrayDeque<String> queue = new ArrayDeque<>();
        Map<String, String> parent = new HashMap<>();
        Set<String> visited = new HashSet<>();

        queue.add(sourceKey);
        visited.add(sourceKey);

        while (!queue.isEmpty()) {
            String current = queue.removeFirst();
            if (current.equals(destinationKey)) {
                break;
            }

            for (String neighbor : ROUTE_GRAPH.getOrDefault(current, Set.of())) {
                if (visited.contains(neighbor)) {
                    continue;
                }

                visited.add(neighbor);
                parent.put(neighbor, current);
                queue.addLast(neighbor);
            }
        }

        if (!visited.contains(destinationKey)) {
            return List.of();
        }

        List<String> reversedPath = new ArrayList<>();
        String cursor = destinationKey;
        while (cursor != null) {
            reversedPath.add(cursor);
            if (cursor.equals(sourceKey)) {
                break;
            }
            cursor = parent.get(cursor);
        }

        if (reversedPath.isEmpty() || !sourceKey.equals(reversedPath.get(reversedPath.size() - 1))) {
            return List.of();
        }

        java.util.Collections.reverse(reversedPath);
        return reversedPath;
    }

    private int estimateTravelMinutes(String fromCity, String toCity) {
        String marker = normalizeCityKey(fromCity) + "->" + normalizeCityKey(toCity);
        int hash = Math.abs(marker.hashCode());
        return 150 + (hash % 390);
    }

    private Map<String, String> buildStopTimeline(List<String> routeStops, String departureTime, int totalTravelMinutes) {
        Map<String, String> timeline = new LinkedHashMap<>();
        Integer departure = toMinutes(departureTime);
        if (routeStops == null || routeStops.isEmpty()) {
            return timeline;
        }

        if (departure == null) {
            for (String stop : routeStops) {
                timeline.put(stop, departureTime == null ? "" : departureTime);
            }
            return timeline;
        }

        int segmentCount = Math.max(routeStops.size() - 1, 1);
        double segmentMinutes = (double) totalTravelMinutes / segmentCount;

        for (int index = 0; index < routeStops.size(); index += 1) {
            int stopMinutes = departure + (int) Math.round(segmentMinutes * index);
            timeline.put(routeStops.get(index), fromMinutes(stopMinutes));
        }

        return timeline;
    }

    private Integer toMinutes(String value) {
        if (value == null) {
            return null;
        }

        String[] parts = value.trim().split("\\s+");
        if (parts.length != 2) {
            return null;
        }

        String[] timePart = parts[0].split(":");
        if (timePart.length != 2) {
            return null;
        }

        try {
            int hour = Integer.parseInt(timePart[0]);
            int minute = Integer.parseInt(timePart[1]);
            String amPm = parts[1].toUpperCase();

            if ("PM".equals(amPm) && hour != 12) {
                hour += 12;
            } else if ("AM".equals(amPm) && hour == 12) {
                hour = 0;
            }

            return (hour * 60) + minute;
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String fromMinutes(int totalMinutes) {
        int safeMinutes = totalMinutes % 1440;
        if (safeMinutes < 0) {
            safeMinutes += 1440;
        }

        int hour = safeMinutes / 60;
        int minute = safeMinutes % 60;
        String amPm = hour >= 12 ? "PM" : "AM";
        int hour12 = hour % 12;
        if (hour12 == 0) {
            hour12 = 12;
        }

        return String.format("%02d:%02d %s", hour12, minute, amPm);
    }

    private int safeTimeSortValue(String value) {
        Integer parsed = toMinutes(value);
        return parsed == null ? Integer.MAX_VALUE : parsed;
    }
}
