package com.booking.backend.model;

public class PaymentRecord {
    public String paymentId;
    public String passengerName;
    public String mobile;
    public String email;
    public int amount;
    public String transactionId;
    public String status;
    public String createdAt;

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

    public String getPaymentId() { return paymentId; }
    public String getPassengerName() { return passengerName; }
    public String getMobile() { return mobile; }
    public String getEmail() { return email; }
    public int getAmount() { return amount; }
    public String getTransactionId() { return transactionId; }
    public String getStatus() { return status; }
    public String getCreatedAt() { return createdAt; }
}
