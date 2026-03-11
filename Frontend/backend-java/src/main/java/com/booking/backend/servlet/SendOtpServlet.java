package com.booking.backend.servlet;

import com.booking.backend.dao.OtpDao;
import com.booking.backend.model.SendOtpRequest;
import com.booking.backend.utils.EmailUtil;
import com.booking.backend.utils.JsonUtil;
import com.booking.backend.utils.OtpGenerator;
import com.booking.backend.utils.ResponseUtil;
import com.booking.backend.utils.ValidationUtil;
import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class SendOtpServlet extends HttpServlet {

    private final OtpDao otpDao;

    public SendOtpServlet(OtpDao otpDao) {
        this.otpDao = otpDao;
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
        boolean debugOtp = EmailUtil.isOtpDebugEnabled();

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

            if (!smtpConfigured && !debugOtp) {
                ResponseUtil.json(resp, HttpServletResponse.SC_SERVICE_UNAVAILABLE, Map.of(
                        "success", false,
                        "message", EmailUtil.smtpMissingMessage()
                ));
                return;
            }

            try {
                otpDao.saveOtp(email, otp, expiry);
                if (smtpConfigured) {
                    EmailUtil.sendOtpEmail(email, otp);
                    ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of(
                            "success", true,
                            "message", "OTP sent to email. Check Inbox/Spam/Promotions."
                    ));
                } else {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("message", "SMTP not configured. OTP generated for local testing.");
                    response.put("warning", EmailUtil.smtpMissingMessage());
                    response.put("otp", otp);
                    ResponseUtil.json(resp, HttpServletResponse.SC_OK, response);
                }
            } catch (RuntimeException e) {
                e.printStackTrace();
                ResponseUtil.json(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, Map.of(
                        "success", false,
                        "message", "Failed to save OTP. Check database settings."
                ));
            } catch (MessagingException e) {
                e.printStackTrace();
                if (debugOtp) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("message", "OTP generated, but email delivery failed.");
                    response.put("warning", e.getMessage() == null || e.getMessage().isBlank()
                            ? "Email delivery failed. Check SMTP settings."
                            : e.getMessage());
                    response.put("otp", otp);
                    ResponseUtil.json(resp, HttpServletResponse.SC_OK, response);
                } else {
                    String errorMessage = e.getMessage() == null || e.getMessage().isBlank()
                            ? "Failed to send OTP email. Check SMTP settings."
                            : "Failed to send OTP email: " + e.getMessage();
                    ResponseUtil.json(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, Map.of(
                            "success", false,
                            "message", errorMessage
                    ));
                }
            }
            return;
        }

        if (!ValidationUtil.isValidMobile(mobile)) {
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                    "success", false,
                    "message", "Invalid mobile. Expected format +91XXXXXXXXXX"
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

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "OTP sent to mobile");
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, response);
    }
}
