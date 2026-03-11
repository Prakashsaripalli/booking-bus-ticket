package com.booking.backend.model;

public class BookingRecord {
    private final String bookingId;
    private final String from;
    private final String to;
    private final String busName;
    private final String seats;
    private final String journeyDate;
    private final String departureTime;
    private final int originalAmount;
    private final int amount;
    private final int discountAmount;
    private final String passengerName;
    private final String passengerMobile;
    private final String passengerEmail;
    private final String ownerEmail;
    private final String ownerMobile;
    private final String paymentMethod;
    private final String transactionId;
    private final String status;
    private final String bookedAt;
    private final String cancelledAt;
    private final String refundStatus;
    private final int refundAmount;
    private final String refundedAt;

    public BookingRecord(
            String bookingId,
            String from,
            String to,
            String busName,
            String seats,
            String journeyDate,
            String departureTime,
            int originalAmount,
            int amount,
            int discountAmount,
            String passengerName,
            String passengerMobile,
            String passengerEmail,
            String ownerEmail,
            String ownerMobile,
            String paymentMethod,
            String transactionId,
            String status,
            String bookedAt,
            String cancelledAt,
            String refundStatus,
            int refundAmount,
            String refundedAt
    ) {
        this.bookingId = bookingId;
        this.from = from;
        this.to = to;
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
    public String getFrom() { return from; }
    public String getTo() { return to; }
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
