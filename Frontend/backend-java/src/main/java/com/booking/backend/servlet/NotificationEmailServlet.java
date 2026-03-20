package com.booking.backend.servlet;

import com.booking.backend.model.NotificationEmailRequest;
import com.booking.backend.utils.EmailUtil;
import com.booking.backend.utils.JsonUtil;
import com.booking.backend.utils.ResponseUtil;
import com.booking.backend.utils.ValidationUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

public class NotificationEmailServlet extends HttpServlet {

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of("success", true));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        NotificationEmailRequest payload = JsonUtil.mapper().readValue(req.getInputStream(), NotificationEmailRequest.class);

        String type = payload.type == null ? "" : payload.type.trim().toLowerCase();
        String email = payload.email == null ? "" : payload.email.trim().toLowerCase();
        String name = payload.name == null ? "" : payload.name.trim();

        if (!ValidationUtil.isValidEmail(email)) {
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                    "success", false,
                    "message", "Valid email is required"
            ));
            return;
        }

        boolean emailDeliveryEnabled = EmailUtil.isEmailDeliveryEnabled();
        boolean debugEmail = EmailUtil.shouldSkipEmail();
        if (!emailDeliveryEnabled) {
            if (debugEmail) {
                ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of(
                        "success", true,
                        "message", "Email delivery skipped for local testing.",
                        "warning", EmailUtil.smtpMissingMessage()
                ));
                return;
            }
            ResponseUtil.json(resp, HttpServletResponse.SC_SERVICE_UNAVAILABLE, Map.of(
                    "success", false,
                    "message", EmailUtil.smtpMissingMessage()
            ));
            return;
        }

        try {
            switch (type) {
                case "booking_cancelled" -> EmailUtil.sendTicketCancellationEmail(
                        email,
                        name,
                        payload.bookingId,
                        payload.from,
                        payload.to,
                        payload.busName,
                        payload.departureTime,
                        payload.journeyDate,
                        payload.seats,
                        payload.paymentMethod,
                        payload.amount,
                        payload.discountAmount,
                        payload.transactionId
                );
                case "forgot_password" -> EmailUtil.sendForgotPasswordEmail(
                        email,
                        name,
                        payload.password
                );
                case "booking_refunded" -> EmailUtil.sendRefundSuccessEmail(
                        email,
                        name,
                        payload.bookingId,
                        payload.from,
                        payload.to,
                        payload.busName,
                        payload.departureTime,
                        payload.journeyDate,
                        payload.seats,
                        payload.paymentMethod,
                        payload.amount,
                        payload.transactionId
                );
                default -> {
                    ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                            "success", false,
                            "message", "Unsupported notification type"
                    ));
                    return;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            if (debugEmail) {
                ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of(
                        "success", true,
                        "message", "Email delivery skipped for local testing.",
                        "warning", e.getMessage() == null || e.getMessage().isBlank()
                                ? "Failed to send notification email."
                                : e.getMessage()
                ));
            } else {
                ResponseUtil.json(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, Map.of(
                        "success", false,
                        "message", e.getMessage() == null || e.getMessage().isBlank()
                                ? "Failed to send notification email"
                                : e.getMessage()
                ));
            }
            return;
        }

        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of(
                "success", true,
                "message", "Notification email sent"
        ));
    }
}
