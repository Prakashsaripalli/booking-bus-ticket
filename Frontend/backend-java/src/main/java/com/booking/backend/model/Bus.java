package com.booking.backend.model;

public class Bus {
    private final int id;
    private final String name;
    private final String fromCity;
    private final String toCity;
    private final String departureTime;
    private final String busType;
    private final int price;

    public Bus(int id, String name, String fromCity, String toCity, String departureTime, String busType, int price) {
        this.id = id;
        this.name = name;
        this.fromCity = fromCity;
        this.toCity = toCity;
        this.departureTime = departureTime;
        this.busType = busType;
        this.price = price;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getFromCity() {
        return fromCity;
    }

    public String getToCity() {
        return toCity;
    }

    public String getDepartureTime() {
        return departureTime;
    }

    public String getBusType() {
        return busType;
    }

    public int getPrice() {
        return price;
    }
}
