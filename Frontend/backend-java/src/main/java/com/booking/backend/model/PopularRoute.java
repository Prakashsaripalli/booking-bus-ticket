package com.booking.backend.model;

public class PopularRoute {
    public String from;
    public String to;
    public int bookingCount;

    public PopularRoute(String from, String to, int bookingCount) {
        this.from = from;
        this.to = to;
        this.bookingCount = bookingCount;
    }
}
