package com.booking.backend.model;

import java.util.ArrayList;
import java.util.List;

public class Bus {
    public int id;
    public String name;
    public String fromCity;
    public String toCity;
    public String departureTime;
    public String busType;
    public int price;
    public String arrivalTime;
    public String sourceDepartureTime;
    public String destinationArrivalTime;
    public List<String> routeStops;

    public Bus(int id, String name, String fromCity, String toCity, String departureTime, String busType, int price) {
        this(id, name, fromCity, toCity, departureTime, busType, price, "", departureTime, "", List.of(fromCity, toCity));
    }

    public Bus(
            int id,
            String name,
            String fromCity,
            String toCity,
            String departureTime,
            String busType,
            int price,
            String arrivalTime,
            String sourceDepartureTime,
            String destinationArrivalTime,
            List<String> routeStops
    ) {
        this.id = id;
        this.name = name;
        this.fromCity = fromCity;
        this.toCity = toCity;
        this.departureTime = departureTime;
        this.busType = busType;
        this.price = price;
        this.arrivalTime = arrivalTime;
        this.sourceDepartureTime = sourceDepartureTime;
        this.destinationArrivalTime = destinationArrivalTime;
        this.routeStops = routeStops == null ? new ArrayList<>() : new ArrayList<>(routeStops);
    }
}
