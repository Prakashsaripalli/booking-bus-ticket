package com.booking.backend.model;

public class PopularRoute {
    private final String fromCity;
    private final String toCity;
    private final int busCount;

    public PopularRoute(String fromCity, String toCity, int busCount) {
        this.fromCity = fromCity;
        this.toCity = toCity;
        this.busCount = busCount;
    }

    public String getFromCity() {
        return fromCity;
    }

    public String getToCity() {
        return toCity;
    }

    public int getBusCount() {
        return busCount;
    }
}
