package com.booking.backend.model;

import java.util.ArrayList;
import java.util.List;

public class BusRoute {
    public String fromCity;
    public String toCity;
    public List<String> routeStops;
    public int busCount;

    public BusRoute(String fromCity, String toCity, List<String> routeStops, int busCount) {
        this.fromCity = fromCity;
        this.toCity = toCity;
        this.routeStops = routeStops == null ? new ArrayList<>() : new ArrayList<>(routeStops);
        this.busCount = busCount;
    }
}
