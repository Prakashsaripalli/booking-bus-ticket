package com.booking.backend.utils;

import java.util.concurrent.ThreadLocalRandom;

public final class OtpGenerator {

    private OtpGenerator() {
    }

    public static String generateSixDigitOtp() {
        int otp = ThreadLocalRandom.current().nextInt(100000, 1000000);
        return String.valueOf(otp);
    }
}
