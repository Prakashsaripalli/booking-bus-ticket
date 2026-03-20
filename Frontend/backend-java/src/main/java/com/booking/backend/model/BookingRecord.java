package com.booking.backend.model;

public class BookingRecord {
    public String bookingId;
    public String fromCity;
    public String toCity;
    public String busName;
    public String seats;
    public String journeyDate;
    public String departureTime;
    public int originalAmount;
    public int amount;
    public int discountAmount;
    public String passengerName;
    public String passengerMobile;
    public String passengerEmail;
    public String ownerEmail;
    public String ownerMobile;
    public String paymentMethod;
    public String transactionId;
    public String status;
    public String bookedAt;
    public String cancelledAt;
    public String refundStatus;
    public int refundAmount;
    public String refundedAt;

    public BookingRecord(String bookingId, String fromCity, String toCity, String busName, String seats, String journeyDate, String departureTime, int originalAmount, int amount, int discountAmount, String passengerName, String passengerMobile, String passengerEmail, String ownerEmail, String ownerMobile, String paymentMethod, String transactionId, String status, String bookedAt, String cancelledAt, String refundStatus, int refundAmount, String refundedAt) {
        this.bookingId = bookingId;
        this.fromCity = fromCity;
        this.toCity = toCity;
        this.busName = busName;
        this.seats = seats;
        this.journeyDate = journeyDate;
        this.departureTime = departureTime;
        this.originalAmount = originalAmount;
        this.amount = amount;
        this.discountAmount = discountAmount;
        this.passengerName = passengerName;
        this.passengerMobile = passengerMobile;
        this.passengerEmail = passengerEmail;
        this.ownerEmail = ownerEmail;
        this.ownerMobile = ownerMobile;
        this.paymentMethod = paymentMethod;
        this.transactionId = transactionId;
        this.status = status;
        this.bookedAt = bookedAt;
        this.cancelledAt = cancelledAt;
        this.refundStatus = refundStatus;
        this.refundAmount = refundAmount;
        this.refundedAt = refundedAt;
    }

    public String getBookingId() { return bookingId; }
    public String getFrom() { return fromCity; }
    public String getTo() { return toCity; }
    public String getBusName() { return busName; }
    public String getSeats() { return seats; }
    public String getJourneyDate() { return journeyDate; }
    public String getDepartureTime() { return departureTime; }
    public int getOriginalAmount() { return originalAmount; }
    public int getAmount() { return amount; }
    public int getDiscountAmount() { return discountAmount; }
    public String getPassengerName() { return passengerName; }
    public String getPassengerMobile() { return passengerMobile; }
    public String getPassengerEmail() { return passengerEmail; }
    public String getOwnerEmail() { return ownerEmail; }
    public String getOwnerMobile() { return ownerMobile; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getTransactionId() { return transactionId; }
    public String getStatus() { return status; }
    public String getBookedAt() { return bookedAt; }
    public String getCancelledAt() { return cancelledAt; }
    public String getRefundStatus() { return refundStatus; }
    public int getRefundAmount() { return refundAmount; }
    public String getRefundedAt() { return refundedAt; }
}
