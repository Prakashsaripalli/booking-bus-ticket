package com.booking.backend.model;

public class PaymentRecord {
    private final String paymentId;
    private final String passengerName;
    private final String mobile;
    private final String email;
    private final int amount;
    private final String transactionId;
    private final String status;
    private final String createdAt;

    public PaymentRecord(String paymentId, String passengerName, String mobile, String email, int amount, String transactionId, String status, String createdAt) {
        this.paymentId = paymentId;
        this.passengerName = passengerName;
        this.mobile = mobile;
        this.email = email;
        this.amount = amount;
        this.transactionId = transactionId;
        this.status = status;
        this.createdAt = createdAt;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public String getPassengerName() {
        return passengerName;
    }

    public String getMobile() {
        return mobile;
    }

    public String getEmail() {
        return email;
    }

    public int getAmount() {
        return amount;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public String getStatus() {
        return status;
    }

    public String getCreatedAt() {
        return createdAt;
    }
}
