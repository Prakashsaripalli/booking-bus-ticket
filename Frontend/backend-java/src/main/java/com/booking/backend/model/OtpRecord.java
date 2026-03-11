package com.booking.backend.model;

public class OtpRecord {
    private final String mobile;
    private final String otp;
    private final long expiresAt;

    public OtpRecord(String mobile, String otp, long expiresAt) {
        this.mobile = mobile;
        this.otp = otp;
        this.expiresAt = expiresAt;
    }

    public String getMobile() {
        return mobile;
    }

    public String getOtp() {
        return otp;
    }

    public long getExpiresAt() {
        return expiresAt;
    }
}
