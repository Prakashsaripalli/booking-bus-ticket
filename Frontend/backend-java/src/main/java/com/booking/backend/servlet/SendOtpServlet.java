package com.booking.backend.servlet;

import com.booking.backend.dao.OtpDao;
import com.booking.backend.model.SendOtpRequest;
import com.booking.backend.utils.Config;
import com.booking.backend.utils.EmailUtil;
import com.booking.backend.utils.JsonUtil;
import com.booking.backend.utils.OtpGenerator;
import com.booking.backend.utils.ResponseUtil;
import com.booking.backend.utils.ValidationUtil;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import jakarta.mail.MessagingException;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class SendOtpServlet extends HttpServlet {

    private OtpDao otpDao;

    public SendOtpServlet() {
    }

    public SendOtpServlet(OtpDao otpDao) {
        this.otpDao = otpDao;
    }

    @Override
    public void init() {
        if (this.otpDao == null) {
            this.otpDao = new OtpDao();
        }
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of("success", true));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        SendOtpRequest payload = JsonUtil.mapper().readValue(req.getInputStream(), SendOtpRequest.class);
        String mobile = payload.mobile == null ? "" : payload.mobile.trim();
        String email = payload.email == null ? "" : payload.email.trim().toLowerCase();

        boolean smtpConfigured = EmailUtil.isSmtpConfigured();
        boolean otpDebugEnabled = Config.isOtpDebug();

        if (mobile.isEmpty() && email.isEmpty()) {
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                    "success", false,
                    "message", "Either mobile or email is required"
            ));
            return;
        }

        String otp = OtpGenerator.generateSixDigitOtp();
        final long expiry = 5 * 60 * 1000L;

        if (!email.isEmpty()) {
            if (!ValidationUtil.isValidEmail(email)) {
                ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                        "success", false,
                        "message", "Invalid email address"
                ));
                return;
            }

            try {
                otpDao.saveOtp(email, otp, expiry);

                if (otpDebugEnabled) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("message", "OTP saved to database in debug mode.");
                    response.put("otp", otp);
                    response.put("target", email);
                    ResponseUtil.json(resp, HttpServletResponse.SC_OK, response);
                    return;
                }

                if (!smtpConfigured) {
                    ResponseUtil.json(resp, HttpServletResponse.SC_SERVICE_UNAVAILABLE, Map.of(
                            "success", false,
                            "message", EmailUtil.smtpMissingMessage() + " OTP was still saved in the database."
                    ));
                    return;
                }

                EmailUtil.sendOtpEmail(email, otp);

                ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of(
                        "success", true,
                        "message", "OTP sent to email. Check Inbox/Spam/Promotions."
                ));
            } catch (MessagingException e) {
                ResponseUtil.json(resp, HttpServletResponse.SC_BAD_GATEWAY, Map.of(
                        "success", false,
                        "message", EmailUtil.smtpFailureMessage(e) + " OTP remains saved in the database."
                ));
            } catch (RuntimeException e) {
                e.printStackTrace();
                ResponseUtil.json(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, Map.of(
                        "success", false,
                        "message", "Failed to save OTP. Check database settings."
                ));
            }
            return;
        }

        if (!ValidationUtil.isValidMobile(mobile)) {
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                    "success", false,
                    "message", "Invalid mobile. Expected 10 digits or +91XXXXXXXXXX"
            ));
            return;
        }

        try {
            otpDao.saveOtp(mobile, otp, expiry);
        } catch (RuntimeException e) {
            e.printStackTrace();
            ResponseUtil.json(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, Map.of(
                    "success", false,
                    "message", "Failed to save OTP. Check database settings."
            ));
            return;
        }

        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of(
                "success", true,
                "message", "OTP sent to mobile"
        ));
    }
}
